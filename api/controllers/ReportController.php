<?php
class ReportController {
    public static function salesSummary(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $db = Database::getInstance();
        $period = $_GET['period'] ?? 'month';
        $dateFrom = $_GET['date_from'] ?? null;
        $dateTo   = $_GET['date_to'] ?? null;

        if (!$dateFrom || !$dateTo) {
            $dateTo = date('Y-m-d');
            $dateFrom = match ($period) {
                'day'   => date('Y-m-d'),
                'week'  => date('Y-m-d', strtotime('-6 days')),
                'year'  => date('Y-01-01'),
                default => date('Y-m-01'),
            };
        }

        $groupFormat = match ($period) {
            'day'  => '%Y-%m-%d %H:00',
            'week' => '%Y-%m-%d',
            'year' => '%Y-%m',
            default => '%Y-%m-%d',
        };

        $summary = $db->prepare("
            SELECT
                COUNT(*) AS total_sales,
                COALESCE(SUM(total_amt), 0) AS total_revenue,
                COALESCE(SUM(discount_amt), 0) AS total_discounts,
                COALESCE(SUM(tax_amt), 0) AS total_tax,
                COALESCE(AVG(total_amt), 0) AS avg_sale_value
            FROM sales
            WHERE status = 'completed'
              AND DATE(created_at) BETWEEN ? AND ?
        ");
        $summary->execute([$dateFrom, $dateTo]);
        $totals = $summary->fetch();

        $trend = $db->prepare("
            SELECT DATE_FORMAT(created_at, ?) AS period_label,
                   COUNT(*) AS sales_count,
                   COALESCE(SUM(total_amt), 0) AS revenue
            FROM sales
            WHERE status = 'completed'
              AND DATE(created_at) BETWEEN ? AND ?
            GROUP BY period_label
            ORDER BY period_label ASC
        ");
        $trend->execute([$groupFormat, $dateFrom, $dateTo]);

        Response::success([
            'period'     => $period,
            'date_from'  => $dateFrom,
            'date_to'    => $dateTo,
            'summary'    => $totals,
            'trend'      => $trend->fetchAll(),
        ]);
    }

    public static function topProducts(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $db = Database::getInstance();
        $limit    = min(50, max(1, (int)($_GET['limit'] ?? 10)));
        $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
        $dateTo   = $_GET['date_to'] ?? date('Y-m-d');

        $stmt = $db->prepare("
            SELECT p.product_id, p.name, p.sku, p.barcode,
                   SUM(si.qty) AS units_sold,
                   SUM(si.line_total) AS revenue,
                   COUNT(DISTINCT si.sale_id) AS order_count
            FROM sale_items si
            INNER JOIN sales s ON si.sale_id = s.sale_id
            INNER JOIN products p ON si.product_id = p.product_id
            WHERE s.status = 'completed'
              AND DATE(s.created_at) BETWEEN ? AND ?
            GROUP BY p.product_id, p.name, p.sku, p.barcode
            ORDER BY units_sold DESC
            LIMIT $limit
        ");
        $stmt->execute([$dateFrom, $dateTo]);
        Response::success([
            'date_from' => $dateFrom,
            'date_to'   => $dateTo,
            'products'  => $stmt->fetchAll(),
        ]);
    }

    public static function revenueExpenses(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $db = Database::getInstance();
        $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
        $dateTo   = $_GET['date_to'] ?? date('Y-m-d');

        $revenue = $db->prepare("
            SELECT COALESCE(SUM(total_amt), 0) AS total
            FROM sales
            WHERE status = 'completed' AND DATE(created_at) BETWEEN ? AND ?
        ");
        $revenue->execute([$dateFrom, $dateTo]);
        $totalRevenue = (float) $revenue->fetchColumn();

        $expenses = $db->prepare("
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE expense_date BETWEEN ? AND ?
        ");
        $expenses->execute([$dateFrom, $dateTo]);
        $totalExpenses = (float) $expenses->fetchColumn();

        $byCategory = $db->prepare("
            SELECT category, SUM(amount) AS total
            FROM expenses
            WHERE expense_date BETWEEN ? AND ?
            GROUP BY category
            ORDER BY total DESC
        ");
        $byCategory->execute([$dateFrom, $dateTo]);

        $monthly = $db->prepare("
            SELECT m.month_label,
                   COALESCE(r.revenue, 0) AS revenue,
                   COALESCE(e.expenses, 0) AS expenses
            FROM (
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_label
                FROM sales WHERE DATE(created_at) BETWEEN ? AND ?
                UNION
                SELECT DATE_FORMAT(expense_date, '%Y-%m') FROM expenses WHERE expense_date BETWEEN ? AND ?
            ) m
            LEFT JOIN (
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_label, SUM(total_amt) AS revenue
                FROM sales WHERE status = 'completed' AND DATE(created_at) BETWEEN ? AND ?
                GROUP BY month_label
            ) r ON m.month_label = r.month_label
            LEFT JOIN (
                SELECT DATE_FORMAT(expense_date, '%Y-%m') AS month_label, SUM(amount) AS expenses
                FROM expenses WHERE expense_date BETWEEN ? AND ?
                GROUP BY month_label
            ) e ON m.month_label = e.month_label
            GROUP BY m.month_label, r.revenue, e.expenses
            ORDER BY m.month_label ASC
        ");
        $monthly->execute([$dateFrom, $dateTo, $dateFrom, $dateTo, $dateFrom, $dateTo, $dateFrom, $dateTo]);

        Response::success([
            'date_from'      => $dateFrom,
            'date_to'        => $dateTo,
            'total_revenue'  => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit'     => round($totalRevenue - $totalExpenses, 2),
            'expenses_by_category' => $byCategory->fetchAll(),
            'monthly'        => $monthly->fetchAll(),
        ]);
    }

    public static function cashierPerformance(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $db = Database::getInstance();
        $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
        $dateTo   = $_GET['date_to'] ?? date('Y-m-d');

        $stmt = $db->prepare("
            SELECT u.user_id, u.full_name, u.username,
                   COUNT(s.sale_id) AS total_sales,
                   COALESCE(SUM(s.total_amt), 0) AS total_revenue,
                   COALESCE(AVG(s.total_amt), 0) AS avg_sale_value,
                   COALESCE(SUM(s.discount_amt), 0) AS total_discounts
            FROM users u
            INNER JOIN sales s ON u.user_id = s.cashier_id
            WHERE u.role = 'cashier'
              AND s.status = 'completed'
              AND DATE(s.created_at) BETWEEN ? AND ?
            GROUP BY u.user_id, u.full_name, u.username
            ORDER BY total_revenue DESC
        ");
        $stmt->execute([$dateFrom, $dateTo]);
        Response::success([
            'date_from' => $dateFrom,
            'date_to'   => $dateTo,
            'cashiers'  => $stmt->fetchAll(),
        ]);
    }

    public static function stockValue(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $db = Database::getInstance();

        $totals = $db->query("
            SELECT
                COUNT(*) AS total_products,
                COALESCE(SUM(stock_qty), 0) AS total_units,
                COALESCE(SUM(stock_qty * cost_price), 0) AS cost_value,
                COALESCE(SUM(stock_qty * selling_price), 0) AS retail_value,
                COALESCE(SUM(stock_qty * (selling_price - cost_price)), 0) AS potential_margin
            FROM products
            WHERE is_active = 1
        ")->fetch();

        $byCategory = $db->query("
            SELECT c.category_id, c.name AS category_name,
                   COUNT(p.product_id) AS product_count,
                   COALESCE(SUM(p.stock_qty), 0) AS total_units,
                   COALESCE(SUM(p.stock_qty * p.cost_price), 0) AS cost_value,
                   COALESCE(SUM(p.stock_qty * p.selling_price), 0) AS retail_value
            FROM categories c
            LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
            GROUP BY c.category_id, c.name
            ORDER BY retail_value DESC
        ")->fetchAll();

        $lowStock = $db->query("
            SELECT COUNT(*) AS count FROM products
            WHERE is_active = 1 AND stock_qty <= reorder_level
        ")->fetchColumn();

        Response::success([
            'totals'      => $totals,
            'by_category' => $byCategory,
            'low_stock_count' => (int) $lowStock,
        ]);
    }

    public static function overview(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $db = Database::getInstance();
        $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
        $dateTo   = $_GET['date_to'] ?? date('Y-m-d');

        $usersByRole = $db->query("
            SELECT role, COUNT(*) AS count
            FROM users
            WHERE is_active = 1
            GROUP BY role
        ")->fetchAll();

        $userStats = $db->query("
            SELECT
                COUNT(*) AS total,
                SUM(is_active = 1) AS active,
                SUM(is_active = 0) AS inactive
            FROM users
        ")->fetch();

        $productStats = $db->query("
            SELECT
                COUNT(*) AS total,
                SUM(is_active = 1) AS active,
                SUM(is_active = 1 AND stock_qty <= reorder_level) AS low_stock
            FROM products
        ")->fetch();

        $customerCount = (int) $db->query('SELECT COUNT(*) FROM customers')->fetchColumn();
        $supplierCount = (int) $db->query('SELECT COUNT(*) FROM suppliers WHERE is_active = 1')->fetchColumn();
        $categoryCount = (int) $db->query('SELECT COUNT(*) FROM categories WHERE is_active = 1')->fetchColumn();

        $salesInPeriod = $db->prepare("
            SELECT
                COUNT(*) AS total_sales,
                COALESCE(SUM(total_amt), 0) AS total_revenue,
                COALESCE(AVG(total_amt), 0) AS avg_sale_value
            FROM sales
            WHERE status = 'completed'
              AND DATE(created_at) BETWEEN ? AND ?
        ");
        $salesInPeriod->execute([$dateFrom, $dateTo]);
        $salesStats = $salesInPeriod->fetch();

        $salesToday = $db->query("
            SELECT COUNT(*) AS count, COALESCE(SUM(total_amt), 0) AS revenue
            FROM sales
            WHERE status = 'completed' AND DATE(created_at) = CURDATE()
        ")->fetch();

        $poStats = $db->prepare("
            SELECT
                COUNT(*) AS total,
                SUM(status = 'pending') AS pending,
                SUM(status = 'approved') AS approved,
                SUM(status = 'received') AS received
            FROM purchase_orders
            WHERE DATE(created_at) BETWEEN ? AND ?
        ");
        $poStats->execute([$dateFrom, $dateTo]);
        $purchaseOrders = $poStats->fetch();

        $expenseTotal = $db->prepare("
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE expense_date BETWEEN ? AND ?
        ");
        $expenseTotal->execute([$dateFrom, $dateTo]);

        $stockMovements = $db->prepare("
            SELECT COUNT(*) AS count
            FROM stock_movements
            WHERE DATE(created_at) BETWEEN ? AND ?
        ");
        $stockMovements->execute([$dateFrom, $dateTo]);

        Response::success([
            'date_from' => $dateFrom,
            'date_to'   => $dateTo,
            'users'     => [
                'total'    => (int) $userStats['total'],
                'active'   => (int) $userStats['active'],
                'inactive' => (int) $userStats['inactive'],
                'by_role'  => $usersByRole,
            ],
            'products'  => [
                'total'     => (int) $productStats['total'],
                'active'    => (int) $productStats['active'],
                'low_stock' => (int) $productStats['low_stock'],
            ],
            'customers'       => $customerCount,
            'suppliers'       => $supplierCount,
            'categories'      => $categoryCount,
            'sales'           => [
                'period'        => $salesStats,
                'today'         => $salesToday,
            ],
            'purchase_orders' => $purchaseOrders,
            'expenses_total'  => (float) $expenseTotal->fetchColumn(),
            'stock_movements' => (int) $stockMovements->fetchColumn(),
        ]);
    }

    public static function recentChanges(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $db = Database::getInstance();
        $since = $_GET['since'] ?? date('Y-m-d H:i:s', strtotime('-24 hours'));
        $limit = min(50, max(5, (int)($_GET['limit'] ?? 20)));

        $auditStmt = $db->prepare("
            SELECT a.log_id, a.action, a.module, a.target_id, a.created_at,
                   u.full_name AS user_name
            FROM audit_log a
            LEFT JOIN users u ON a.user_id = u.user_id
            WHERE a.created_at >= ?
            ORDER BY a.created_at DESC
            LIMIT $limit
        ");
        $auditStmt->execute([$since]);
        $recentAudit = $auditStmt->fetchAll();

        $recentSales = $db->prepare("
            SELECT s.sale_id, s.sale_ref, s.total_amt, s.status, s.created_at,
                   u.full_name AS cashier_name
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.user_id
            WHERE s.created_at >= ?
            ORDER BY s.created_at DESC
            LIMIT 10
        ");
        $recentSales->execute([$since]);

        $recentStock = $db->prepare("
            SELECT sm.movement_id, sm.movement_type, sm.qty_change, sm.created_at,
                   p.name AS product_name, u.full_name AS user_name
            FROM stock_movements sm
            INNER JOIN products p ON sm.product_id = p.product_id
            LEFT JOIN users u ON sm.user_id = u.user_id
            WHERE sm.created_at >= ?
            ORDER BY sm.created_at DESC
            LIMIT 10
        ");
        $recentStock->execute([$since]);

        $recentProducts = $db->prepare("
            SELECT product_id, name, sku, stock_qty, updated_at
            FROM products
            WHERE updated_at >= ?
            ORDER BY updated_at DESC
            LIMIT 10
        ");
        $recentProducts->execute([$since]);

        $periodStart = date('Y-m-d H:i:s', strtotime($since));
        $prevStart   = date('Y-m-d H:i:s', strtotime($since . ' -24 hours'));

        $currentSales = $db->prepare("
            SELECT COUNT(*) AS count, COALESCE(SUM(total_amt), 0) AS revenue
            FROM sales
            WHERE status = 'completed' AND created_at >= ?
        ");
        $currentSales->execute([$periodStart]);
        $current = $currentSales->fetch();

        $previousSales = $db->prepare("
            SELECT COUNT(*) AS count, COALESCE(SUM(total_amt), 0) AS revenue
            FROM sales
            WHERE status = 'completed'
              AND created_at >= ? AND created_at < ?
        ");
        $previousSales->execute([$prevStart, $periodStart]);
        $previous = $previousSales->fetch();

        $newUsers = $db->prepare('SELECT COUNT(*) FROM users WHERE created_at >= ?');
        $newUsers->execute([$since]);

        Response::success([
            'since'            => $since,
            'generated_at'     => date('c'),
            'audit_entries'    => $recentAudit,
            'recent_sales'     => $recentSales->fetchAll(),
            'stock_movements'  => $recentStock->fetchAll(),
            'updated_products' => $recentProducts->fetchAll(),
            'changes_summary'  => [
                'audit_count'       => count($recentAudit),
                'new_users'         => (int) $newUsers->fetchColumn(),
                'sales_current'     => $current,
                'sales_previous'    => $previous,
                'sales_count_delta' => (int) $current['count'] - (int) $previous['count'],
                'sales_revenue_delta' => round((float) $current['revenue'] - (float) $previous['revenue'], 2),
            ],
        ]);
    }
}
