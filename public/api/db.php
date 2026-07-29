<?php
require_once __DIR__ . '/db_config.php';

class DB {
    private static $pdo = null;
    private static $useFallbackJson = false;

    public static function getConnection() {
        if (self::$pdo === null && !self::$useFallbackJson) {
            try {
                $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                self::$pdo = new PDO($dsn, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (Exception $e) {
                self::$useFallbackJson = true;
            }
        }
        return self::$pdo;
    }

    public static function isJsonFallback() {
        self::getConnection();
        return self::$useFallbackJson;
    }

    public static function getJsonData() {
        $jsonPath = __DIR__ . '/../../data/db.json';
        if (!file_exists($jsonPath)) {
            $jsonPath = __DIR__ . '/../jobs.json';
            if (file_exists($jsonPath)) {
                $jobs = json_decode(file_get_contents($jsonPath), true) ?: [];
                return [
                    'admin' => ['id' => 'admin-1', 'username' => 'umar', 'passwordHash' => password_hash('Sho2026@', PASSWORD_DEFAULT)],
                    'users' => [],
                    'jobs' => $jobs,
                    'applications' => [],
                    'settings' => [
                        'applicationFee' => 1500,
                        'jazzcash' => ['accountTitle' => 'Jobs Hub Official', 'accountNumber' => '03001234567', 'instructions' => 'Send payment to JazzCash account and upload screenshot'],
                        'easypaisa' => ['accountTitle' => 'Jobs Hub Official', 'accountNumber' => '03451234567', 'instructions' => 'Send payment to Easypaisa account and upload screenshot']
                    ]
                ];
            }
            return ['admin' => [], 'users' => [], 'jobs' => [], 'applications' => [], 'settings' => []];
        }
        $data = json_decode(file_get_contents($jsonPath), true);
        return is_array($data) ? $data : ['admin' => [], 'users' => [], 'jobs' => [], 'applications' => [], 'settings' => []];
    }

    public static function saveJsonData($data) {
        $dir = __DIR__ . '/../../data';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($dir . '/db.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}
