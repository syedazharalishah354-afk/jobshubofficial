<?php
// Hostinger MySQL Database Credentials
// Update these values according to your Hostinger MySQL database details created in Hostinger hPanel -> Databases
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'jobshub_db');
define('DB_USER', getenv('DB_USER') ?: 'jobshub_user');
define('DB_PASS', getenv('DB_PASS') ?: 'YourPasswordHere');
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'jobshub_official_jwt_secret_key_2026');
