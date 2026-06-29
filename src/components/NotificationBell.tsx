import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck, AlertTriangle, CheckCircle, RotateCcw, XCircle, FileCheck, FileUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";
import type { AppNotification } from "@/services/notification.service";

// Konfigurasi icon & warna per tipe notifikasi
const TYPE_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}> = {
  contract_submitted: {
    label: "Kontrak Diajukan",
    icon: FileCheck,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  review_requested: {
    label: "Perlu Ditinjau",
    icon: Clock,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  manager_approved: {
    label: "Kontrak Ditandatangani Pihak Pertama",
    icon: CheckCircle,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  manager_rejected: {
    label: "Kontrak Ditolak",
    icon: XCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
  },
  manager_revision_requested: {
    label: "Revisi Diminta Pihak Pertama",
    icon: RotateCcw,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-500",
  },
  external_revision_requested: {
    label: "Revisi Diminta Pihak Kedua",
    icon: RotateCcw,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  all_reviewers_signed: {
    label: "Dokumen Disahkan",
    icon: FileUp,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  signed_document_uploaded: {
    label: "Dokumen Bertandatangan Diupload",
    icon: FileUp,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  external_approved: {
    label: "Dokumen Disetujui",
    icon: CheckCheck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  external_signing_sent: {
    label: "Dikirim ke Pihak Eksternal",
    icon: FileCheck,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  contract_activated: {
    label: "Kontrak telah Aktif",
    icon: CheckCircle,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  contract_expiring: {
    label: "Kontrak Akan Kedaluwarsa",
    icon: AlertTriangle,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
  },
  contract_addendum: {
    label: "Addendum Ditambahkan",
    icon: FileCheck,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  contract_terminating: {
    label: "Terminasi Diajukan",
    icon: AlertTriangle,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  contract_terminated: {
    label: "Kontrak Dihentikan",
    icon: XCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  partner_contract_added: {
  label: "Kontrak Mitra Ditambahkan",
  icon: FileUp,
  iconBg: "bg-blue-100",
  iconColor: "text-blue-600",
},
};

const DEFAULT_CONFIG = {
  label: "Notifikasi",
  icon: Bell,
  iconBg: "bg-gray-100",
  iconColor: "text-gray-500",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }) + " " + date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, handleMarkRead, handleMarkAllRead, handleDelete } =
    useNotifications();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClickNotif = async (notif: AppNotification) => {
    try {
      if (!notif.is_read) await handleMarkRead(notif.id);
    } catch (e) {
      console.error("markRead error:", e);
    }

    if (!notif.contract_id) {
      setOpen(false);
      return;
    }

    const managerTypes = ["review_requested"];

    if (managerTypes.includes(notif.type)) {
      navigate(`/approvals/${notif.contract_id}`);
    } else {
      navigate(`/contracts/${notif.contract_id}/view`);
    }

    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>

      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">

          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-gray-900">Notifikasi</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            {unreadCount > 0 ? (
              <p className="text-xs text-gray-400">{unreadCount} notifikasi belum dibaca</p>
            ) : (
              <p className="text-xs text-gray-400">Semua notifikasi sudah dibaca</p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-5" />

          {/* List */}
          <div className="max-h-80 overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}
          >
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-400">Memuat...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Tidak ada notifikasi.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] ?? DEFAULT_CONFIG;
                const Icon = config.icon;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleClickNotif(notif)}
                    className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                      !notif.is_read ? "bg-gray-50/70" : "bg-white"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${config.iconBg}`}>
                      <Icon className={`h-4 w-4 ${config.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-tight mb-0.5">
                        {config.label}
                      </p>
                      <p className={`text-xs text-gray-500 leading-relaxed ${
                            expandedIds.has(notif.id) ? "" : "line-clamp-2"
                          }`}>
                            {notif.message}
                      </p>
                      {notif.message.length > 80 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(notif.id);
                          }}
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium mt-0.5"
                        >
                          {expandedIds.has(notif.id) ? "Sembunyikan" : "Baca selengkapnya"}
                        </button>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1.5">
                        {formatDate(notif.created_at)}
                      </p>
                    </div>

                    {/* unread dot + tombol hapus */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notif.id);
                        }}
                        className="p-1 rounded-full hover:bg-red-50 transition-colors group"
                        title="Hapus notifikasi"
                      >
                        <X className="h-3.5 w-3.5 text-gray-300 group-hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {unreadCount > 0 && (
            <>
              <div className="h-px bg-gray-100" />
              <div className="px-5 py-3 flex justify-end">
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Tandai semua dibaca
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}