<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

// Parse Request URI and Method
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Normalize path removing base script prefix if routed directly or rewritten
$path = preg_replace('#^/api/#', '', $requestUri);
$path = preg_replace('#^/index\.php/#', '', $path);
$path = trim($path, '/');

// Get Request Body
$body = json_decode(file_get_contents('php://input'), true) ?: [];

// Qualification Rank Logic
function getMinQualificationRank($qual) {
    if (!$qual) return 1;
    $q = strtolower(trim($qual));
    if (strpos($q, 'phd') !== false || strpos($q, 'doctorate') !== false) return 9;
    if (strpos($q, 'mphil') !== false) return 8;
    if (strpos($q, 'master') !== false || strpos($q, 'ma') !== false || strpos($q, 'msc') !== false) return 7;
    if (strpos($q, 'bachelor') !== false || strpos($q, 'bs') !== false || strpos($q, 'ba') !== false || strpos($q, 'bsc') !== false || strpos($q, 'graduate') !== false) return 6;
    if (strpos($q, 'intermediate') !== false || strpos($q, 'fa') !== false || strpos($q, 'fsc') !== false || strpos($q, 'diploma') !== false || strpos($q, 'ics') !== false || strpos($q, 'icom') !== false || strpos($q, 'dae') !== false) return 5;
    if (strpos($q, 'matric') !== false || strpos($q, 'ssc') !== false || strpos($q, '10th') !== false) return 4;
    if (strpos($q, 'middle') !== false || strpos($q, '8th') !== false) return 3;
    if (strpos($q, 'primary') !== false || strpos($q, '5th') !== false) return 2;
    return 1; // No Formal Education
}

function isJobUnlocked($applicantQual, $jobMinQual) {
    $appRank = getMinQualificationRank($applicantQual);
    $jobRank = getMinQualificationRank($jobMinQual);
    return $appRank >= $jobRank;
}

function cleanCNIC($cnic) {
    return preg_replace('/\D/', '', $cnic ?: '');
}

function formatCNICDisplay($cnic) {
    $c = cleanCNIC($cnic);
    if (strlen($c) !== 13) return $cnic;
    return substr($c, 0, 5) . '-' . substr($c, 5, 7) . '-' . substr($c, 12, 1);
}

// Auth Helpers
function getAuthHeader() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) return $headers['Authorization'];
    if (isset($headers['authorization'])) return $headers['authorization'];
    return '';
}

function authenticateAdmin() {
    $auth = getAuthHeader();
    if (!preg_match('/Bearer\s+(\S+)/i', $auth, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized. Admin token required.']);
        exit();
    }
    $payload = verifyJWT($matches[1], JWT_SECRET);
    if (!$payload || !isset($payload['username'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token.']);
        exit();
    }
    return $payload;
}

function authenticateUser() {
    $auth = getAuthHeader();
    if (!preg_match('/Bearer\s+(\S+)/i', $auth, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'User authentication required.']);
        exit();
    }
    $payload = verifyJWT($matches[1], JWT_SECRET);
    if (!$payload || !isset($payload['email'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired session. Please log in again.']);
        exit();
    }
    return $payload;
}

// --- ROUTE HANDLERS ---

// 1. Health Check
if ($path === 'health' || $path === '') {
    echo json_encode(['status' => 'ok', 'name' => 'JobsHubOfficial Portal']);
    exit();
}

// 2. Public Config
if ($path === 'config' && $method === 'GET') {
    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        echo json_encode($json['settings'] ?? [
            'applicationFee' => 1500,
            'jazzcash' => ['accountTitle' => 'Jobs Hub Official', 'accountNumber' => '03001234567', 'instructions' => 'Send payment to JazzCash account'],
            'easypaisa' => ['accountTitle' => 'Jobs Hub Official', 'accountNumber' => '03451234567', 'instructions' => 'Send payment to Easypaisa account']
        ]);
        exit();
    }
    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'app_settings'");
    $stmt->execute();
    $row = $stmt->fetch();
    if ($row) {
        $s = json_decode($row['setting_value'], true);
        echo json_encode([
            'applicationFee' => $s['applicationFee'] ?? 1500,
            'jazzcash' => $s['jazzcash'] ?? [],
            'easypaisa' => $s['easypaisa'] ?? []
        ]);
    } else {
        echo json_encode([
            'applicationFee' => 1500,
            'jazzcash' => ['accountTitle' => 'Jobs Hub Official', 'accountNumber' => '03001234567', 'instructions' => 'Send payment to JazzCash account'],
            'easypaisa' => ['accountTitle' => 'Jobs Hub Official', 'accountNumber' => '03451234567', 'instructions' => 'Send payment to Easypaisa account']
        ]);
    }
    exit();
}

// 3. Public Jobs
if (($path === 'jobs' || strpos($path, 'jobs/') === 0) && $method === 'GET') {
    $parts = explode('/', $path);
    $jobId = isset($parts[1]) ? $parts[1] : null;

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $jobs = $json['jobs'] ?? [];
        if ($jobId) {
            foreach ($jobs as $j) {
                if ($j['id'] === $jobId) {
                    echo json_encode($j);
                    exit();
                }
            }
            http_response_code(404);
            echo json_encode(['error' => 'Job position not found.']);
            exit();
        }
        $campaign = $_GET['campaign'] ?? null;
        if ($campaign && $campaign !== 'all') {
            $filtered = array_values(array_filter($jobs, function($j) use ($campaign) {
                return (isset($j['campaigns']) && is_array($j['campaigns']) && in_array($campaign, $j['campaigns'])) ||
                       (isset($j['campaign']) && $j['campaign'] === $campaign);
            }));
            echo json_encode($filtered);
            exit();
        }
        echo json_encode(array_values($jobs));
        exit();
    }

    $pdo = DB::getConnection();
    if ($jobId) {
        $stmt = $pdo->prepare("SELECT * FROM jobs WHERE id = ?");
        $stmt->execute([$jobId]);
        $row = $stmt->fetch();
        if ($row) {
            $row['requiredSkills'] = json_decode($row['required_skills'], true) ?: [];
            $row['campaigns'] = json_decode($row['campaigns'], true) ?: [];
            $row['companyName'] = $row['company_name'];
            $row['companyLogo'] = $row['company_logo'];
            $row['employmentType'] = $row['employment_type'];
            $row['minQualification'] = $row['min_qualification'];
            $row['qualificationRequired'] = $row['qualification_required'];
            $row['medicalQualification'] = $row['medical_qualification'];
            $row['experienceRequired'] = $row['experience_required'];
            $row['jobType'] = $row['job_type'];
            $row['ageLimit'] = $row['age_limit'];
            $row['salaryRange'] = $row['salary_range'];
            $row['applicationMethod'] = $row['application_method'];
            $row['applicationUrl'] = $row['application_url'];
            $row['postedDate'] = $row['posted_date'];
            echo json_encode($row);
            exit();
        }
        http_response_code(404);
        echo json_encode(['error' => 'Job position not found.']);
        exit();
    }

    $stmt = $pdo->query("SELECT * FROM jobs WHERE status IN ('active', 'published') OR status IS NULL OR status = ''");
    $rows = $stmt->fetchAll();
    $jobsList = array_map(function($r) {
        $r['requiredSkills'] = json_decode($r['required_skills'], true) ?: [];
        $r['campaigns'] = json_decode($r['campaigns'], true) ?: [];
        $r['companyName'] = $r['company_name'];
        $r['companyLogo'] = $r['company_logo'];
        $r['employmentType'] = $r['employment_type'];
        $r['minQualification'] = $r['min_qualification'];
        $r['qualificationRequired'] = $r['qualification_required'];
        $r['medicalQualification'] = $r['medical_qualification'];
        $r['experienceRequired'] = $r['experience_required'];
        $r['jobType'] = $r['job_type'];
        $r['ageLimit'] = $r['age_limit'];
        $r['salaryRange'] = $r['salary_range'];
        $r['applicationMethod'] = $r['application_method'];
        $r['applicationUrl'] = $r['application_url'];
        $r['postedDate'] = $r['posted_date'];
        return $r;
    }, $rows);

    $campaign = $_GET['campaign'] ?? null;
    if ($campaign && $campaign !== 'all') {
        $jobsList = array_values(array_filter($jobsList, function($j) use ($campaign) {
            return (isset($j['campaigns']) && is_array($j['campaigns']) && in_array($campaign, $j['campaigns']));
        }));
    }

    echo json_encode($jobsList);
    exit();
}

// 4. File Upload Endpoint
if ($path === 'upload' && $method === 'POST') {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded or file upload error.']);
        exit();
    }
    $uploadDir = __DIR__ . '/../../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $filename = 'doc-' . time() . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
    $target = $uploadDir . $filename;
    if (move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
        echo json_encode([
            'fileUrl' => '/uploads/' . $filename,
            'filename' => $filename
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save uploaded file.']);
    }
    exit();
}

// 5. Submit Application Step 1
if ($path === 'applications/step1' && $method === 'POST') {
    $fullName = trim($body['fullName'] ?? '');
    $fatherName = trim($body['fatherName'] ?? '');
    $cnic = trim($body['cnic'] ?? '');
    $email = trim($body['email'] ?? '');
    $mobile = trim($body['mobile'] ?? '');
    $qualification = trim($body['qualification'] ?? '');
    $address = trim($body['address'] ?? '');
    $postalCode = trim($body['postalCode'] ?? '');
    $jobPosition = trim($body['jobPosition'] ?? 'General Application');
    $cnicFrontUrl = trim($body['cnicFrontUrl'] ?? '');
    $cnicBackUrl = trim($body['cnicBackUrl'] ?? '');

    if (!$fullName || !$fatherName || !cleanCNIC($cnic) || strlen(cleanCNIC($cnic)) !== 13 || !$email || !$mobile || !$qualification || !$address || !$postalCode || !$cnicFrontUrl || !$cnicBackUrl) {
        http_response_code(400);
        echo json_encode(['error' => 'Please provide all required application details and CNIC document images.']);
        exit();
    }

    $formattedCNIC = formatCNICDisplay($cnic);
    $now = date('c');

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $apps = $json['applications'] ?? [];
        $existingIndex = -1;
        foreach ($apps as $idx => $a) {
            if (cleanCNIC($a['cnic']) === cleanCNIC($cnic) && $a['jobPosition'] === $jobPosition) {
                $existingIndex = $idx;
                break;
            }
        }
        if ($existingIndex >= 0) {
            $apps[$existingIndex]['fullName'] = $fullName;
            $apps[$existingIndex]['fatherName'] = $fatherName;
            $apps[$existingIndex]['email'] = $email;
            $apps[$existingIndex]['mobile'] = $mobile;
            $apps[$existingIndex]['qualification'] = $qualification;
            $apps[$existingIndex]['address'] = $address;
            $apps[$existingIndex]['postalCode'] = $postalCode;
            $apps[$existingIndex]['cnicFrontUrl'] = $cnicFrontUrl;
            $apps[$existingIndex]['cnicBackUrl'] = $cnicBackUrl;
            $apps[$existingIndex]['updatedAt'] = $now;
            if (($apps[$existingIndex]['status'] ?? '') === 'Information Incomplete') {
                $apps[$existingIndex]['status'] = 'Payment Pending';
            }
            $appRecord = $apps[$existingIndex];
        } else {
            $ref = 'JHO-' . date('Y') . '-' . rand(10000, 99999);
            $appRecord = [
                'id' => 'app-' . time() . '-' . bin2hex(random_bytes(3)),
                'referenceNo' => $ref,
                'fullName' => $fullName,
                'fatherName' => $fatherName,
                'cnic' => $formattedCNIC,
                'email' => $email,
                'mobile' => $mobile,
                'qualification' => $qualification,
                'address' => $address,
                'postalCode' => $postalCode,
                'jobPosition' => $jobPosition,
                'cnicFrontUrl' => $cnicFrontUrl,
                'cnicBackUrl' => $cnicBackUrl,
                'paymentScreenshotUrl' => null,
                'paymentMethod' => null,
                'paymentTxnId' => null,
                'status' => 'Payment Pending',
                'rejectionReason' => null,
                'createdAt' => $now,
                'updatedAt' => $now
            ];
            $apps[] = $appRecord;
        }
        $json['applications'] = $apps;
        DB::saveJsonData($json);
        echo json_encode(['message' => 'Application information saved successfully.', 'application' => $appRecord]);
        exit();
    }

    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("SELECT * FROM applications WHERE cnic = ? AND job_position = ?");
    $stmt->execute([$formattedCNIC, $jobPosition]);
    $existing = $stmt->fetch();

    if ($existing) {
        $updateStmt = $pdo->prepare("UPDATE applications SET full_name = ?, father_name = ?, email = ?, mobile = ?, qualification = ?, address = ?, postal_code = ?, cnic_front_url = ?, cnic_back_url = ?, status = 'Payment Pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $updateStmt->execute([$fullName, $fatherName, $email, $mobile, $qualification, $address, $postalCode, $cnicFrontUrl, $cnicBackUrl, $existing['id']]);
        $existing['fullName'] = $fullName;
        $existing['fatherName'] = $fatherName;
        $existing['cnic'] = $formattedCNIC;
        $existing['email'] = $email;
        $existing['mobile'] = $mobile;
        $existing['qualification'] = $qualification;
        $existing['address'] = $address;
        $existing['postalCode'] = $postalCode;
        $existing['jobPosition'] = $jobPosition;
        $existing['cnicFrontUrl'] = $cnicFrontUrl;
        $existing['cnicBackUrl'] = $cnicBackUrl;
        $existing['status'] = 'Payment Pending';
        echo json_encode(['message' => 'Application information updated successfully.', 'application' => $existing]);
    } else {
        $appId = 'app-' . time() . '-' . bin2hex(random_bytes(3));
        $ref = 'JHO-' . date('Y') . '-' . rand(10000, 99999);
        $insertStmt = $pdo->prepare("INSERT INTO applications (id, reference_no, full_name, father_name, cnic, email, mobile, qualification, address, postal_code, job_position, cnic_front_url, cnic_back_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Payment Pending')");
        $insertStmt->execute([$appId, $ref, $fullName, $fatherName, $formattedCNIC, $email, $mobile, $qualification, $address, $postalCode, $jobPosition, $cnicFrontUrl, $cnicBackUrl]);
        
        $appRecord = [
            'id' => $appId,
            'referenceNo' => $ref,
            'fullName' => $fullName,
            'fatherName' => $fatherName,
            'cnic' => $formattedCNIC,
            'email' => $email,
            'mobile' => $mobile,
            'qualification' => $qualification,
            'address' => $address,
            'postalCode' => $postalCode,
            'jobPosition' => $jobPosition,
            'cnicFrontUrl' => $cnicFrontUrl,
            'cnicBackUrl' => $cnicBackUrl,
            'paymentScreenshotUrl' => null,
            'paymentMethod' => null,
            'paymentTxnId' => null,
            'status' => 'Payment Pending',
            'rejectionReason' => null,
            'createdAt' => $now,
            'updatedAt' => $now
        ];
        echo json_encode(['message' => 'Application information saved successfully.', 'application' => $appRecord]);
    }
    exit();
}

// 6. Submit Payment Screenshot
if (preg_match('#^applications/([^/]+)/payment$#', $path, $m) && $method === 'POST') {
    $id = $m[1];
    $paymentMethod = $body['paymentMethod'] ?? 'JazzCash';
    $paymentScreenshotUrl = $body['paymentScreenshotUrl'] ?? '';
    $paymentTxnId = $body['paymentTxnId'] ?? null;

    if (!$paymentScreenshotUrl) {
        http_response_code(400);
        echo json_encode(['error' => 'Payment screenshot upload is required.']);
        exit();
    }

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $apps = $json['applications'] ?? [];
        foreach ($apps as &$a) {
            if ($a['id'] === $id || $a['referenceNo'] === $id) {
                $a['paymentMethod'] = $paymentMethod;
                $a['paymentScreenshotUrl'] = $paymentScreenshotUrl;
                $a['paymentTxnId'] = $paymentTxnId;
                $a['status'] = 'Payment Verification Pending';
                $a['rejectionReason'] = null;
                $a['updatedAt'] = date('c');
                $json['applications'] = $apps;
                DB::saveJsonData($json);
                echo json_encode(['message' => 'Payment screenshot submitted for verification.', 'application' => $a]);
                exit();
            }
        }
        http_response_code(404);
        echo json_encode(['error' => 'Application not found.']);
        exit();
    }

    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("UPDATE applications SET payment_method = ?, payment_screenshot_url = ?, payment_txn_id = ?, status = 'Payment Verification Pending', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR reference_no = ?");
    $stmt->execute([$paymentMethod, $paymentScreenshotUrl, $paymentTxnId, $id, $id]);

    $fetchStmt = $pdo->prepare("SELECT * FROM applications WHERE id = ? OR reference_no = ?");
    $fetchStmt->execute([$id, $id]);
    $appRecord = $fetchStmt->fetch();
    if ($appRecord) {
        $appRecord['fullName'] = $appRecord['full_name'];
        $appRecord['fatherName'] = $appRecord['father_name'];
        $appRecord['referenceNo'] = $appRecord['reference_no'];
        $appRecord['postalCode'] = $appRecord['postal_code'];
        $appRecord['jobPosition'] = $appRecord['job_position'];
        $appRecord['cnicFrontUrl'] = $appRecord['cnic_front_url'];
        $appRecord['cnicBackUrl'] = $appRecord['cnic_back_url'];
        $appRecord['paymentScreenshotUrl'] = $appRecord['payment_screenshot_url'];
        $appRecord['paymentMethod'] = $appRecord['payment_method'];
        $appRecord['paymentTxnId'] = $appRecord['payment_txn_id'];
        $appRecord['rejectionReason'] = $appRecord['rejection_reason'];
        echo json_encode(['message' => 'Payment screenshot submitted for verification.', 'application' => $appRecord]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Application not found.']);
    }
    exit();
}

// 7. Track Application
if ($path === 'applications/track' && $method === 'GET') {
    $query = trim($_GET['query'] ?? '');
    if (!$query) {
        http_response_code(400);
        echo json_encode(['error' => 'Please enter CNIC Number or Application Reference Number.']);
        exit();
    }

    $cleanQ = cleanCNIC($query);

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $apps = $json['applications'] ?? [];
        $matched = array_values(array_filter($apps, function($a) use ($query, $cleanQ) {
            $refMatch = strtolower($a['referenceNo']) === strtolower($query);
            $cnicMatch = strlen($cleanQ) >= 10 && cleanCNIC($a['cnic']) === $cleanQ;
            return $refMatch || $cnicMatch;
        }));
        if (count($matched) === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'No application found matching details.']);
            exit();
        }
        echo json_encode(['applications' => $matched]);
        exit();
    }

    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("SELECT * FROM applications WHERE LOWER(reference_no) = LOWER(?) OR REPLACE(cnic, '-', '') = ? ORDER BY created_at DESC");
    $stmt->execute([$query, $cleanQ]);
    $rows = $stmt->fetchAll();
    if (count($rows) === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'No application found matching details.']);
        exit();
    }
    $apps = array_map(function($r) {
        $r['fullName'] = $r['full_name'];
        $r['fatherName'] = $r['father_name'];
        $r['referenceNo'] = $r['reference_no'];
        $r['postalCode'] = $r['postal_code'];
        $r['jobPosition'] = $r['job_position'];
        $r['cnicFrontUrl'] = $r['cnic_front_url'];
        $r['cnicBackUrl'] = $r['cnic_back_url'];
        $r['paymentScreenshotUrl'] = $r['payment_screenshot_url'];
        $r['paymentMethod'] = $r['payment_method'];
        $r['paymentTxnId'] = $r['payment_txn_id'];
        $r['rejectionReason'] = $r['rejection_reason'];
        return $r;
    }, $rows);
    echo json_encode(['applications' => $apps]);
    exit();
}

// 8. Get Application by ID
if (preg_match('#^applications/([^/]+)$#', $path, $m) && $method === 'GET') {
    $id = $m[1];
    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $apps = $json['applications'] ?? [];
        foreach ($apps as $a) {
            if ($a['id'] === $id || $a['referenceNo'] === $id) {
                echo json_encode($a);
                exit();
            }
        }
        http_response_code(404);
        echo json_encode(['error' => 'Application not found.']);
        exit();
    }
    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("SELECT * FROM applications WHERE id = ? OR reference_no = ?");
    $stmt->execute([$id, $id]);
    $r = $stmt->fetch();
    if ($r) {
        $r['fullName'] = $r['full_name'];
        $r['fatherName'] = $r['father_name'];
        $r['referenceNo'] = $r['reference_no'];
        $r['postalCode'] = $r['postal_code'];
        $r['jobPosition'] = $r['job_position'];
        $r['cnicFrontUrl'] = $r['cnic_front_url'];
        $r['cnicBackUrl'] = $r['cnic_back_url'];
        $r['paymentScreenshotUrl'] = $r['payment_screenshot_url'];
        $r['paymentMethod'] = $r['payment_method'];
        $r['paymentTxnId'] = $r['payment_txn_id'];
        $r['rejectionReason'] = $r['rejection_reason'];
        echo json_encode($r);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Application not found.']);
    }
    exit();
}

// 9. User Auth Routes
if ($path === 'auth/register' && $method === 'POST') {
    $fullName = trim($body['fullName'] ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    $cnic = cleanCNIC($body['cnic'] ?? '');
    $password = $body['password'] ?? '';

    if (!$fullName || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($cnic) !== 13 || strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid Full Name, Email, 13-digit CNIC, and 6+ char password required.']);
        exit();
    }

    $passHash = password_hash($password, PASSWORD_DEFAULT);
    $formattedCnic = formatCNICDisplay($cnic);
    $userId = 'user-' . time() . '-' . bin2hex(random_bytes(3));

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $users = $json['users'] ?? [];
        foreach ($users as $u) {
            if ($u['email'] === $email || cleanCNIC($u['cnic']) === $cnic) {
                http_response_code(400);
                echo json_encode(['error' => 'Account with this email or CNIC already exists.']);
                exit();
            }
        }
        $newUser = [
            'id' => $userId,
            'fullName' => $fullName,
            'email' => $email,
            'cnic' => $formattedCnic,
            'passwordHash' => $passHash,
            'role' => 'user',
            'createdAt' => date('c')
        ];
        $users[] = $newUser;
        $json['users'] = $users;
        DB::saveJsonData($json);

        $token = generateJWT(['id' => $userId, 'email' => $email, 'cnic' => $formattedCnic, 'fullName' => $fullName, 'role' => 'user'], JWT_SECRET);
        echo json_encode(['message' => 'Registration successful.', 'token' => $token, 'user' => ['id' => $userId, 'fullName' => $fullName, 'email' => $email, 'cnic' => $formattedCnic, 'role' => 'user']]);
        exit();
    }

    $pdo = DB::getConnection();
    $chkStmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR REPLACE(cnic, '-', '') = ?");
    $chkStmt->execute([$email, $cnic]);
    if ($chkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Account with this email or CNIC already exists.']);
        exit();
    }

    $insStmt = $pdo->prepare("INSERT INTO users (id, full_name, email, cnic, password_hash, role) VALUES (?, ?, ?, ?, ?, 'user')");
    $insStmt->execute([$userId, $fullName, $email, $formattedCnic, $passHash]);

    $token = generateJWT(['id' => $userId, 'email' => $email, 'cnic' => $formattedCnic, 'fullName' => $fullName, 'role' => 'user'], JWT_SECRET);
    echo json_encode(['message' => 'Registration successful.', 'token' => $token, 'user' => ['id' => $userId, 'fullName' => $fullName, 'email' => $email, 'cnic' => $formattedCnic, 'role' => 'user']]);
    exit();
}

if ($path === 'auth/login' && $method === 'POST') {
    $loginInput = trim($body['loginInput'] ?? '');
    $password = $body['password'] ?? '';

    if (!$loginInput || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email/CNIC and password required.']);
        exit();
    }

    $cleanQ = cleanCNIC($loginInput);

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $users = $json['users'] ?? [];
        foreach ($users as $u) {
            $matchEmail = strtolower($u['email']) === strtolower($loginInput);
            $matchCNIC = strlen($cleanQ) === 13 && cleanCNIC($u['cnic']) === $cleanQ;
            if ($matchEmail || $matchCNIC) {
                if (password_verify($password, $u['passwordHash'])) {
                    $token = generateJWT(['id' => $u['id'], 'email' => $u['email'], 'cnic' => $u['cnic'], 'fullName' => $u['fullName'], 'role' => 'user'], JWT_SECRET);
                    echo json_encode(['message' => 'Login successful.', 'token' => $token, 'user' => ['id' => $u['id'], 'fullName' => $u['fullName'], 'email' => $u['email'], 'cnic' => $u['cnic'], 'role' => 'user']]);
                    exit();
                }
            }
        }
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email/CNIC or password.']);
        exit();
    }

    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR REPLACE(cnic, '-', '') = ?");
    $stmt->execute([$loginInput, $cleanQ]);
    $u = $stmt->fetch();
    if ($u && password_verify($password, $u['password_hash'])) {
        $token = generateJWT(['id' => $u['id'], 'email' => $u['email'], 'cnic' => $u['cnic'], 'fullName' => $u['full_name'], 'role' => 'user'], JWT_SECRET);
        echo json_encode(['message' => 'Login successful.', 'token' => $token, 'user' => ['id' => $u['id'], 'fullName' => $u['full_name'], 'email' => $u['email'], 'cnic' => $u['cnic'], 'role' => 'user']]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email/CNIC or password.']);
    }
    exit();
}

if ($path === 'auth/me' && $method === 'GET') {
    $user = authenticateUser();
    echo json_encode(['user' => $user]);
    exit();
}

if ($path === 'user/applications' && $method === 'GET') {
    $user = authenticateUser();
    $cnicClean = cleanCNIC($user['cnic']);
    $email = strtolower($user['email']);

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $apps = $json['applications'] ?? [];
        $matched = array_values(array_filter($apps, function($a) use ($user, $cnicClean, $email) {
            return ($a['userId'] ?? '') === $user['id'] || cleanCNIC($a['cnic']) === $cnicClean || strtolower($a['email']) === $email;
        }));
        echo json_encode($matched);
        exit();
    }

    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("SELECT * FROM applications WHERE user_id = ? OR REPLACE(cnic, '-', '') = ? OR LOWER(email) = ? ORDER BY created_at DESC");
    $stmt->execute([$user['id'], $cnicClean, $email]);
    $rows = $stmt->fetchAll();
    $apps = array_map(function($r) {
        $r['fullName'] = $r['full_name'];
        $r['fatherName'] = $r['father_name'];
        $r['referenceNo'] = $r['reference_no'];
        $r['postalCode'] = $r['postal_code'];
        $r['jobPosition'] = $r['job_position'];
        $r['cnicFrontUrl'] = $r['cnic_front_url'];
        $r['cnicBackUrl'] = $r['cnic_back_url'];
        $r['paymentScreenshotUrl'] = $r['payment_screenshot_url'];
        $r['paymentMethod'] = $r['payment_method'];
        $r['paymentTxnId'] = $r['payment_txn_id'];
        $r['rejectionReason'] = $r['rejection_reason'];
        return $r;
    }, $rows);
    echo json_encode($apps);
    exit();
}

// 10. Admin Routes
if ($path === 'admin/login' && $method === 'POST') {
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    $isDefaultUser = ($username === 'umar' && $password === 'Sho2026@');

    if ($isDefaultUser) {
        $token = generateJWT(['id' => 'admin-1', 'username' => 'umar'], JWT_SECRET, 86400);
        echo json_encode(['message' => 'Admin authentication successful.', 'token' => $token, 'user' => ['username' => 'umar']]);
        exit();
    }

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $admin = $json['admin'] ?? [];
        if (($admin['username'] ?? '') === $username && password_verify($password, $admin['passwordHash'] ?? '')) {
            $token = generateJWT(['id' => $admin['id'] ?? 'admin-1', 'username' => $username], JWT_SECRET, 86400);
            echo json_encode(['message' => 'Admin authentication successful.', 'token' => $token, 'user' => ['username' => $username]]);
            exit();
        }
        http_response_code(401);
        echo json_encode(['error' => 'Invalid admin username or password.']);
        exit();
    }

    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ?");
    $stmt->execute([$username]);
    $a = $stmt->fetch();
    if ($a && password_verify($password, $a['password_hash'])) {
        $token = generateJWT(['id' => $a['id'], 'username' => $a['username']], JWT_SECRET, 86400);
        echo json_encode(['message' => 'Admin authentication successful.', 'token' => $token, 'user' => ['username' => $a['username']]]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid admin username or password.']);
    }
    exit();
}

if ($path === 'admin/me' && $method === 'GET') {
    $admin = authenticateAdmin();
    echo json_encode(['username' => $admin['username']]);
    exit();
}

if ($path === 'admin/change-password' && $method === 'POST') {
    $admin = authenticateAdmin();
    $currPass = $body['currentPassword'] ?? '';
    $newPass = $body['newPassword'] ?? '';

    if (!$currPass || strlen($newPass) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'New password must be at least 6 characters long.']);
        exit();
    }

    $newHash = password_hash($newPass, PASSWORD_DEFAULT);

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $json['admin']['passwordHash'] = $newHash;
        DB::saveJsonData($json);
        echo json_encode(['message' => 'Admin password updated successfully.']);
        exit();
    }

    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("UPDATE admin_users SET password_hash = ? WHERE username = ?");
    $stmt->execute([$newHash, $admin['username']]);
    echo json_encode(['message' => 'Admin password updated successfully.']);
    exit();
}

if ($path === 'admin/stats' && $method === 'GET') {
    authenticateAdmin();

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $apps = $json['applications'] ?? [];
        $jobs = $json['jobs'] ?? [];
        $users = $json['users'] ?? [];

        $pending = count(array_filter($apps, fn($a) => in_array($a['status'] ?? '', ['Payment Verification Pending', 'Payment Pending'])));
        $approved = count(array_filter($apps, fn($a) => in_array($a['status'] ?? '', ['Payment Approved', 'Submitted Successfully'])));
        $rejected = count(array_filter($apps, fn($a) => ($a['status'] ?? '') === 'Payment Rejected'));
        $submitted = count(array_filter($apps, fn($a) => ($a['status'] ?? '') === 'Submitted Successfully'));

        echo json_encode([
            'totalUsers' => count($users),
            'totalJobs' => count($jobs),
            'publishedJobs' => count(array_filter($jobs, fn($j) => in_array($j['status'] ?? '', ['active', 'published']))),
            'unpublishedJobs' => count(array_filter($jobs, fn($j) => in_array($j['status'] ?? '', ['unpublished', 'draft']))),
            'totalApplications' => count($apps),
            'pendingPayments' => $pending,
            'approvedPayments' => $approved,
            'rejectedPayments' => $rejected,
            'submittedSuccessfully' => $submitted
        ]);
        exit();
    }

    $pdo = DB::getConnection();
    $uCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $jCount = $pdo->query("SELECT COUNT(*) FROM jobs")->fetchColumn();
    $aCount = $pdo->query("SELECT COUNT(*) FROM applications")->fetchColumn();
    $pCount = $pdo->query("SELECT COUNT(*) FROM applications WHERE status IN ('Payment Verification Pending', 'Payment Pending')")->fetchColumn();
    $appCount = $pdo->query("SELECT COUNT(*) FROM applications WHERE status IN ('Payment Approved', 'Submitted Successfully')")->fetchColumn();
    $rCount = $pdo->query("SELECT COUNT(*) FROM applications WHERE status = 'Payment Rejected'")->fetchColumn();

    echo json_encode([
        'totalUsers' => (int)$uCount,
        'totalJobs' => (int)$jCount,
        'totalApplications' => (int)$aCount,
        'pendingPayments' => (int)$pCount,
        'approvedPayments' => (int)$appCount,
        'rejectedPayments' => (int)$rCount,
        'submittedSuccessfully' => (int)$appCount
    ]);
    exit();
}

if ($path === 'admin/settings') {
    authenticateAdmin();
    if ($method === 'GET') {
        if (DB::isJsonFallback()) {
            $json = DB::getJsonData();
            echo json_encode($json['settings'] ?? []);
            exit();
        }
        $pdo = DB::getConnection();
        $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'app_settings'");
        $row = $stmt->fetch();
        echo json_encode($row ? json_decode($row['setting_value'], true) : []);
        exit();
    }
    if ($method === 'PUT') {
        if (DB::isJsonFallback()) {
            $json = DB::getJsonData();
            $s = $json['settings'] ?? [];
            if (isset($body['applicationFee'])) $s['applicationFee'] = $body['applicationFee'];
            if (isset($body['jazzcash'])) $s['jazzcash'] = array_merge($s['jazzcash'] ?? [], $body['jazzcash']);
            if (isset($body['easypaisa'])) $s['easypaisa'] = array_merge($s['easypaisa'] ?? [], $body['easypaisa']);
            if (isset($body['interviewPolicy'])) $s['interviewPolicy'] = $body['interviewPolicy'];
            $json['settings'] = $s;
            DB::saveJsonData($json);
            echo json_encode(['message' => 'Settings updated successfully.', 'settings' => $s]);
            exit();
        }
        $pdo = DB::getConnection();
        $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'app_settings'");
        $row = $stmt->fetch();
        $s = $row ? json_decode($row['setting_value'], true) : [];
        if (isset($body['applicationFee'])) $s['applicationFee'] = $body['applicationFee'];
        if (isset($body['jazzcash'])) $s['jazzcash'] = array_merge($s['jazzcash'] ?? [], $body['jazzcash']);
        if (isset($body['easypaisa'])) $s['easypaisa'] = array_merge($s['easypaisa'] ?? [], $body['easypaisa']);
        if (isset($body['interviewPolicy'])) $s['interviewPolicy'] = $body['interviewPolicy'];

        $upStmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('app_settings', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
        $upStmt->execute([json_encode($s)]);
        echo json_encode(['message' => 'Settings updated successfully.', 'settings' => $s]);
        exit();
    }
}

// Admin Applications
if ($path === 'admin/applications' && $method === 'GET') {
    authenticateAdmin();
    $status = $_GET['status'] ?? 'all';
    $search = trim($_GET['search'] ?? '');

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $apps = $json['applications'] ?? [];
        if ($status !== 'all') {
            $apps = array_filter($apps, fn($a) => ($a['status'] ?? '') === $status);
        }
        if ($search) {
            $s = strtolower($search);
            $apps = array_filter($apps, fn($a) => strpos(strtolower($a['fullName'] ?? ''), $s) !== false || strpos(strtolower($a['cnic'] ?? ''), $s) !== false || strpos(strtolower($a['referenceNo'] ?? ''), $s) !== false);
        }
        echo json_encode(array_values($apps));
        exit();
    }

    $pdo = DB::getConnection();
    $sql = "SELECT * FROM applications WHERE 1=1";
    $params = [];
    if ($status !== 'all') {
        $sql .= " AND status = ?";
        $params[] = $status;
    }
    if ($search) {
        $sql .= " AND (LOWER(full_name) LIKE ? OR LOWER(cnic) LIKE ? OR LOWER(reference_no) LIKE ? OR LOWER(job_position) LIKE ?)";
        $s = '%' . strtolower($search) . '%';
        $params[] = $s; $params[] = $s; $params[] = $s; $params[] = $s;
    }
    $sql .= " ORDER BY created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    $apps = array_map(function($r) {
        $r['fullName'] = $r['full_name'];
        $r['fatherName'] = $r['father_name'];
        $r['referenceNo'] = $r['reference_no'];
        $r['postalCode'] = $r['postal_code'];
        $r['jobPosition'] = $r['job_position'];
        $r['cnicFrontUrl'] = $r['cnic_front_url'];
        $r['cnicBackUrl'] = $r['cnic_back_url'];
        $r['paymentScreenshotUrl'] = $r['payment_screenshot_url'];
        $r['paymentMethod'] = $r['payment_method'];
        $r['paymentTxnId'] = $r['payment_txn_id'];
        $r['rejectionReason'] = $r['rejection_reason'];
        return $r;
    }, $rows);
    echo json_encode($apps);
    exit();
}

// Admin Application Verification
if (preg_match('#^admin/applications/([^/]+)/verify$#', $path, $m) && $method === 'POST') {
    authenticateAdmin();
    $id = $m[1];
    $action = $body['action'] ?? '';
    $rejectionReason = $body['rejectionReason'] ?? null;

    if ($action !== 'approve' && $action !== 'reject') {
        http_response_code(400);
        echo json_encode(['error' => 'Action must be approve or reject.']);
        exit();
    }

    $newStatus = ($action === 'approve') ? 'Submitted Successfully' : 'Payment Rejected';
    $reason = ($action === 'reject') ? ($rejectionReason ?: 'Payment screenshot could not be verified.') : null;

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $apps = $json['applications'] ?? [];
        foreach ($apps as &$a) {
            if ($a['id'] === $id || $a['referenceNo'] === $id) {
                $a['status'] = $newStatus;
                $a['rejectionReason'] = $reason;
                $a['updatedAt'] = date('c');
                $json['applications'] = $apps;
                DB::saveJsonData($json);
                echo json_encode(['message' => 'Application updated successfully.', 'application' => $a]);
                exit();
            }
        }
        http_response_code(404);
        echo json_encode(['error' => 'Application not found.']);
        exit();
    }

    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("UPDATE applications SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR reference_no = ?");
    $stmt->execute([$newStatus, $reason, $id, $id]);

    $fetchStmt = $pdo->prepare("SELECT * FROM applications WHERE id = ? OR reference_no = ?");
    $fetchStmt->execute([$id, $id]);
    $appRecord = $fetchStmt->fetch();
    if ($appRecord) {
        $appRecord['fullName'] = $appRecord['full_name'];
        $appRecord['fatherName'] = $appRecord['father_name'];
        $appRecord['referenceNo'] = $appRecord['reference_no'];
        $appRecord['postalCode'] = $appRecord['postal_code'];
        $appRecord['jobPosition'] = $appRecord['job_position'];
        $appRecord['cnicFrontUrl'] = $appRecord['cnic_front_url'];
        $appRecord['cnicBackUrl'] = $appRecord['cnic_back_url'];
        $appRecord['paymentScreenshotUrl'] = $appRecord['payment_screenshot_url'];
        $appRecord['paymentMethod'] = $appRecord['payment_method'];
        $appRecord['paymentTxnId'] = $appRecord['payment_txn_id'];
        $appRecord['rejectionReason'] = $appRecord['rejection_reason'];
        echo json_encode(['message' => 'Application updated successfully.', 'application' => $appRecord]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Application not found.']);
    }
    exit();
}

// Admin Jobs API
if ($path === 'admin/jobs' && $method === 'GET') {
    authenticateAdmin();
    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        echo json_encode(array_values($json['jobs'] ?? []));
        exit();
    }
    $pdo = DB::getConnection();
    $stmt = $pdo->query("SELECT * FROM jobs ORDER BY created_at DESC");
    $rows = $stmt->fetchAll();
    $jobsList = array_map(function($r) {
        $r['requiredSkills'] = json_decode($r['required_skills'], true) ?: [];
        $r['campaigns'] = json_decode($r['campaigns'], true) ?: [];
        $r['companyName'] = $r['company_name'];
        $r['companyLogo'] = $r['company_logo'];
        $r['employmentType'] = $r['employment_type'];
        $r['minQualification'] = $r['min_qualification'];
        $r['qualificationRequired'] = $r['qualification_required'];
        $r['medicalQualification'] = $r['medical_qualification'];
        $r['experienceRequired'] = $r['experience_required'];
        $r['jobType'] = $r['job_type'];
        $r['ageLimit'] = $r['age_limit'];
        $r['salaryRange'] = $r['salary_range'];
        $r['applicationMethod'] = $r['application_method'];
        $r['applicationUrl'] = $r['application_url'];
        $r['postedDate'] = $r['posted_date'];
        return $r;
    }, $rows);
    echo json_encode($jobsList);
    exit();
}

if ($path === 'admin/jobs' && $method === 'POST') {
    authenticateAdmin();
    $title = trim($body['title'] ?? '');
    if (!$title) {
        http_response_code(400);
        echo json_encode(['error' => 'Job title is required.']);
        exit();
    }
    $id = 'job-' . time() . '-' . bin2hex(random_bytes(2));
    $dept = $body['companyName'] ?? $body['department'] ?? 'General';

    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $jobs = $json['jobs'] ?? [];
        $newJob = array_merge($body, ['id' => $id, 'title' => $title, 'status' => $body['status'] ?? 'published']);
        $jobs[] = $newJob;
        $json['jobs'] = $jobs;
        DB::saveJsonData($json);
        echo json_encode(['message' => 'Job created successfully.', 'job' => $newJob]);
        exit();
    }

    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("INSERT INTO jobs (id, title, department, organization, company_name, company_logo, category, country, employment_type, min_qualification, qualification_required, medical_qualification, experience_required, job_type, age_limit, vacancies, location, salary_range, deadline, description, responsibilities, requirements, required_skills, application_method, application_url, posted_date, status, campaigns) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id, $title, $dept, $body['organization'] ?? $dept, $dept, $body['companyLogo'] ?? '',
        $body['category'] ?? 'Government Jobs', $body['country'] ?? 'Pakistan', $body['employmentType'] ?? 'Full-time',
        $body['minQualification'] ?? 'Primary', $body['qualificationRequired'] ?? '', $body['medicalQualification'] ?? '',
        $body['experienceRequired'] ?? 'Fresh / Not Required', $body['jobType'] ?? 'Full-time', $body['ageLimit'] ?? '18 - 45 Years',
        $body['vacancies'] ?? 10, $body['location'] ?? 'Remote / Anywhere in Pakistan', $body['salaryRange'] ?? 'Market Competitive',
        $body['deadline'] ?? '2026-12-31', $body['description'] ?? '', $body['responsibilities'] ?? '', $body['requirements'] ?? '',
        json_encode($body['requiredSkills'] ?? []), $body['applicationMethod'] ?? 'online', $body['applicationUrl'] ?? '',
        $body['postedDate'] ?? date('Y-m-d'), $body['status'] ?? 'published', json_encode($body['campaigns'] ?? [])
    ]);

    $body['id'] = $id;
    echo json_encode(['message' => 'Job created successfully.', 'job' => $body]);
    exit();
}

if (preg_match('#^admin/jobs/bulk-publish$#', $path) && $method === 'POST') {
    authenticateAdmin();
    $ids = $body['ids'] ?? [];
    if (empty($ids)) {
        echo json_encode(['message' => 'No IDs provided']);
        exit();
    }
    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        foreach ($json['jobs'] as &$j) {
            if (in_array($j['id'], $ids)) $j['status'] = 'published';
        }
        DB::saveJsonData($json);
        echo json_encode(['message' => 'Jobs published successfully.']);
        exit();
    }
    $pdo = DB::getConnection();
    $in  = str_repeat('?,', count($ids) - 1) . '?';
    $stmt = $pdo->prepare("UPDATE jobs SET status = 'published' WHERE id IN ($in)");
    $stmt->execute($ids);
    echo json_encode(['message' => 'Jobs published successfully.']);
    exit();
}

if (preg_match('#^admin/jobs/bulk-unpublish$#', $path) && $method === 'POST') {
    authenticateAdmin();
    $ids = $body['ids'] ?? [];
    if (empty($ids)) {
        echo json_encode(['message' => 'No IDs provided']);
        exit();
    }
    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        foreach ($json['jobs'] as &$j) {
            if (in_array($j['id'], $ids)) $j['status'] = 'unpublished';
        }
        DB::saveJsonData($json);
        echo json_encode(['message' => 'Jobs unpublished successfully.']);
        exit();
    }
    $pdo = DB::getConnection();
    $in  = str_repeat('?,', count($ids) - 1) . '?';
    $stmt = $pdo->prepare("UPDATE jobs SET status = 'unpublished' WHERE id IN ($in)");
    $stmt->execute($ids);
    echo json_encode(['message' => 'Jobs unpublished successfully.']);
    exit();
}

if (preg_match('#^admin/jobs/bulk-delete$#', $path) && $method === 'POST') {
    authenticateAdmin();
    $ids = $body['ids'] ?? [];
    if (empty($ids)) {
        echo json_encode(['message' => 'No IDs provided']);
        exit();
    }
    if (DB::isJsonFallback()) {
        $json = DB::getJsonData();
        $json['jobs'] = array_values(array_filter($json['jobs'] ?? [], fn($j) => !in_array($j['id'], $ids)));
        DB::saveJsonData($json);
        echo json_encode(['message' => 'Jobs deleted successfully.']);
        exit();
    }
    $pdo = DB::getConnection();
    $in  = str_repeat('?,', count($ids) - 1) . '?';
    $stmt = $pdo->prepare("DELETE FROM jobs WHERE id IN ($in)");
    $stmt->execute($ids);
    echo json_encode(['message' => 'Jobs deleted successfully.']);
    exit();
}

if (preg_match('#^admin/jobs/([^/]+)$#', $path, $m)) {
    authenticateAdmin();
    $id = $m[1];
    if ($method === 'PUT') {
        if (DB::isJsonFallback()) {
            $json = DB::getJsonData();
            foreach ($json['jobs'] as &$j) {
                if ($j['id'] === $id) {
                    $j = array_merge($j, $body);
                    DB::saveJsonData($json);
                    echo json_encode(['message' => 'Job updated successfully.', 'job' => $j]);
                    exit();
                }
            }
            http_response_code(404);
            echo json_encode(['error' => 'Job position not found.']);
            exit();
        }
        $pdo = DB::getConnection();
        $stmt = $pdo->prepare("UPDATE jobs SET title = COALESCE(?, title), company_name = COALESCE(?, company_name), category = COALESCE(?, category), status = COALESCE(?, status), min_qualification = COALESCE(?, min_qualification), vacancies = COALESCE(?, vacancies), deadline = COALESCE(?, deadline), description = COALESCE(?, description) WHERE id = ?");
        $stmt->execute([
            $body['title'] ?? null, $body['companyName'] ?? null, $body['category'] ?? null,
            $body['status'] ?? null, $body['minQualification'] ?? null, $body['vacancies'] ?? null,
            $body['deadline'] ?? null, $body['description'] ?? null, $id
        ]);
        $body['id'] = $id;
        echo json_encode(['message' => 'Job updated successfully.', 'job' => $body]);
        exit();
    }
    if ($method === 'DELETE') {
        if (DB::isJsonFallback()) {
            $json = DB::getJsonData();
            $json['jobs'] = array_values(array_filter($json['jobs'] ?? [], fn($j) => $j['id'] !== $id));
            DB::saveJsonData($json);
            echo json_encode(['message' => 'Job deleted successfully.']);
            exit();
        }
        $pdo = DB::getConnection();
        $stmt = $pdo->prepare("DELETE FROM jobs WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Job deleted successfully.']);
        exit();
    }
}

// Default 404 for unknown endpoints
http_response_code(404);
echo json_encode(['error' => 'Endpoint not found', 'path' => $path]);
