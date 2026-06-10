<?php
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/config/JWT.php';
require_once __DIR__ . '/config/CORS.php';
require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/helpers/Validator.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/middleware/RoleMiddleware.php';
require_once __DIR__ . '/helpers/AuditLogger.php';

CORS::handle();

foreach (glob(__DIR__ . '/controllers/*.php') as $f) require_once $f;

$method = $_SERVER['REQUEST_METHOD'];
$uri    = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

$base = 'smart-exchange/api';
$uri  = preg_replace('#^' . preg_quote($base, '#') . '#', '', $uri);
$uri  = trim($uri, '/');

$segments = explode('/', $uri);
$resource = $segments[0] ?? '';
$id       = $segments[1] ?? null;
$action   = $segments[2] ?? null;

match (true) {
    // AUTH
    $resource === 'auth' && $id === 'login'           => AuthController::login(),
    $resource === 'auth' && $id === 'register'        => AuthController::register(),
    $resource === 'auth' && $id === 'me'              => AuthController::me(),
    $resource === 'auth' && $id === 'reset-password' => AuthController::resetPassword(),

    // USERS (admin)
    $resource === 'users' && $method === 'GET'    && !$id => UserController::index(),
    $resource === 'users' && $method === 'POST'            => UserController::store(),
    $resource === 'users' && $method === 'PUT'    && $id   => UserController::update((int)$id),
    $resource === 'users' && $method === 'DELETE' && $id   => UserController::destroy((int)$id),

    // PRODUCTS
    $resource === 'products' && $method === 'GET'    && $id === 'low-stock' => ProductController::lowStock(),
    $resource === 'products' && $method === 'GET'    && !$id                => ProductController::index(),
    $resource === 'products' && $method === 'GET'    && $id                 => ProductController::show((int)$id),
    $resource === 'products' && $method === 'POST'                          => ProductController::store(),
    $resource === 'products' && $method === 'PUT'    && $id                 => ProductController::update((int)$id),
    $resource === 'products' && $method === 'DELETE' && $id                 => ProductController::destroy((int)$id),

    // CATEGORIES
    $resource === 'categories' && $method === 'GET' => CategoryController::index(),

    // SALES
    $resource === 'sales' && $method === 'GET'  && !$id => SaleController::index(),
    $resource === 'sales' && $method === 'GET'  && is_numeric($id) => SaleController::show((int)$id),
    $resource === 'sales' && $method === 'POST' && $id === 'online-order' => SaleController::storeOnline(),
    $resource === 'sales' && $method === 'POST'          => SaleController::store(),
    $resource === 'sales' && $method === 'PUT'  && $action === 'void' && is_numeric($id) => SaleController::void((int)$id),
    $resource === 'sales' && $method === 'PUT'  && $action === 'dispatch' && is_numeric($id) => SaleController::dispatch((int)$id),
    $resource === 'sales' && $method === 'PUT'  && $action === 'deliver' && is_numeric($id) => SaleController::deliver((int)$id),

    // PURCHASE ORDERS
    $resource === 'purchase-orders' && $method === 'GET'  && !$id => PurchaseOrderController::index(),
    $resource === 'purchase-orders' && $method === 'GET'  && $id  => PurchaseOrderController::show((int)$id),
    $resource === 'purchase-orders' && $method === 'POST'          => PurchaseOrderController::store(),
    $resource === 'purchase-orders' && $method === 'PUT'  && $id  => PurchaseOrderController::update((int)$id),

    // STOCK
    $resource === 'stock' && $id === 'adjust'  && $method === 'POST' => StockController::adjust(),
    $resource === 'stock' && $id === 'receive' && $method === 'POST' => StockController::receive(),
    $resource === 'stock' && $id === 'movements'                     => StockController::movements(),

    // SUPPLIERS
    $resource === 'suppliers' && $method === 'GET'  && $id === 'me' => SupplierController::me(),
    $resource === 'suppliers' && $method === 'GET'  && !$id => SupplierController::index(),
    $resource === 'suppliers' && $method === 'POST'          => SupplierController::store(),
    $resource === 'suppliers' && $method === 'PUT'  && $id  => SupplierController::update((int)$id),

    // CUSTOMERS
    $resource === 'customers' && $method === 'GET'  && !$id          => CustomerController::index(),
    $resource === 'customers' && $method === 'GET'  && $action === 'orders' => CustomerController::orders((int)$id),

    // REPORTS
    $resource === 'reports' && $id === 'sales-summary'        => ReportController::salesSummary(),
    $resource === 'reports' && $id === 'top-products'         => ReportController::topProducts(),
    $resource === 'reports' && $id === 'revenue-expenses'     => ReportController::revenueExpenses(),
    $resource === 'reports' && $id === 'cashier-performance'  => ReportController::cashierPerformance(),
    $resource === 'reports' && $id === 'stock-value'          => ReportController::stockValue(),
    $resource === 'reports' && $id === 'overview'               => ReportController::overview(),
    $resource === 'reports' && $id === 'recent-changes'         => ReportController::recentChanges(),

    // NOTIFICATIONS
    $resource === 'notifications' && $method === 'GET'                => NotificationController::index(),
    $resource === 'notifications' && $id === 'read-all'               => NotificationController::readAll(),

    // AUDIT
    $resource === 'audit-log' && $method === 'GET' && $id === 'filters' => AuditController::filterOptions(),
    $resource === 'audit-log' && $method === 'GET' => AuditController::index(),

    // BACKUP
    $resource === 'backup' && $id === 'create'  && $method === 'POST' => BackupController::create(),
    $resource === 'backup' && $id === 'history' && $method === 'GET'  => BackupController::history(),
    $resource === 'backup' && $method === 'GET' && $action === 'download' => BackupController::download((int)$id),
    $resource === 'backup' && $method === 'DELETE' && is_numeric($id) => BackupController::destroy((int)$id),

    default => Response::error('Endpoint not found', 404),
};
