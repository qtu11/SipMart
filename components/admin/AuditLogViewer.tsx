"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  History,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

interface AuditLog {
  logId: string;
  actorId?: string;
  actorType: "user" | "admin" | "system";
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

interface Filters {
  actorType: string;
  action: string;
  resourceType: string;
  startDate: string;
  endDate: string;
}

const actionLabels: Record<string, string> = {
  user_login: "🔓 Đăng nhập",
  user_register: "📝 Đăng ký",
  cup_borrow: "🥤 Mượn ly",
  cup_return: "↩️ Trả ly",
  payment_topup: "💰 Nạp tiền",
  reward_claim: "🎁 Đổi thưởng",
  challenge_join: "🎯 Tham gia thử thách",
  admin_broadcast_notification: "📢 Broadcast thông báo",
  system_cron: "⏰ Cron job",
  create_challenge: "🆕 Tạo thử thách",
};

const actorTypeLabels: Record<string, { label: string; color: string }> = {
  user: { label: "Người dùng", color: "bg-blue-100 text-blue-800" },
  admin: { label: "Admin", color: "bg-purple-100 text-purple-800" },
  system: { label: "Hệ thống", color: "bg-gray-100 text-gray-800" },
};

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    actorType: "",
    action: "",
    resourceType: "",
    startDate: "",
    endDate: "",
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("limit", pagination.limit.toString());
        params.append("offset", pagination.offset.toString());

        if (filters.actorType) params.append("actorType", filters.actorType);
        if (filters.action) params.append("action", filters.action);
        if (filters.resourceType)
          params.append("resourceType", filters.resourceType);
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);

        const response = await fetch(
          `/api/admin/audit-logs?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""}`,
            },
          },
        );

        const data = await response.json();

        if (data.success) {
          setLogs(data.logs);
          setPagination((prev) => ({
            ...prev,
            total: data.pagination.total,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [pagination.limit, pagination.offset, filters]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePageChange = (direction: "prev" | "next") => {
    if (direction === "prev" && pagination.offset > 0) {
      setPagination({
        ...pagination,
        offset: pagination.offset - pagination.limit,
      });
    } else if (
      direction === "next" &&
      pagination.offset + pagination.limit < pagination.total
    ) {
      setPagination({
        ...pagination,
        offset: pagination.offset + pagination.limit,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Audit Logs
              </h2>
              <p className="text-sm text-gray-500">
                {pagination.total} bản ghi
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={filters.actorType}
            onChange={(e) =>
              setFilters({ ...filters, actorType: e.target.value })
            }
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          >
            <option value="">Actor Type</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="system">System</option>
          </select>

          <select
            value={filters.resourceType}
            onChange={(e) =>
              setFilters({ ...filters, resourceType: e.target.value })
            }
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          >
            <option value="">Resource Type</option>
            <option value="users">Users</option>
            <option value="cups">Cups</option>
            <option value="transactions">Transactions</option>
            <option value="challenges">Challenges</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          />

          <button
            onClick={() =>
              setFilters({
                actorType: "",
                action: "",
                resourceType: "",
                startDate: "",
                endDate: "",
              })
            }
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Thời gian
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Hành động
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Resource
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Chi tiết
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <motion.tr
                  key={log.logId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        actorTypeLabels[log.actorType]?.color || "bg-gray-100"
                      }`}
                    >
                      {actorTypeLabels[log.actorType]?.label || log.actorType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {actionLabels[log.action] || log.action}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {log.resourceType}
                      {log.resourceId && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({log.resourceId.slice(0, 8)}...)
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Hiển thị {pagination.offset + 1} -{" "}
          {Math.min(pagination.offset + pagination.limit, pagination.total)} của{" "}
          {pagination.total}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange("prev")}
            disabled={pagination.offset === 0}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePageChange("next")}
            disabled={pagination.offset + pagination.limit >= pagination.total}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Chi tiết Audit Log
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500">Log ID</span>
                <span className="text-gray-900 dark:text-white font-mono">
                  {selectedLog.logId}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500">Thời gian</span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(selectedLog.createdAt)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500">Actor Type</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${actorTypeLabels[selectedLog.actorType]?.color}`}
                >
                  {selectedLog.actorType}
                </span>
              </div>
              {selectedLog.actorId && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">Actor ID</span>
                  <span className="text-gray-900 dark:text-white font-mono">
                    {selectedLog.actorId}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500">Action</span>
                <span className="text-gray-900 dark:text-white">
                  {selectedLog.action}
                </span>
              </div>
              {selectedLog.ipAddress && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">IP Address</span>
                  <span className="text-gray-900 dark:text-white font-mono">
                    {selectedLog.ipAddress}
                  </span>
                </div>
              )}

              {selectedLog.newValue && (
                <div className="py-2">
                  <span className="text-gray-500 block mb-2">New Value</span>
                  <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.oldValue && (
                <div className="py-2">
                  <span className="text-gray-500 block mb-2">Old Value</span>
                  <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="mt-6 w-full py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Đóng
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
