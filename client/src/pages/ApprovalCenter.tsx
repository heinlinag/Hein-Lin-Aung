import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw, Trash2, Zap, Info, AlertTriangle, PlayCircle, AlertCircle, MoreVertical, Flag, Edit3, Calendar } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { ActionHistoryCard, type ActionHistoryEvent } from "@/components/ActionHistoryCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PendingRequest = {
  id: number;
  type: "delete" | "used_update";
  orderId: number;
  orderSnapshot: string;
  requestedBy: string;
  workerName: string;
  actionData: string | null;
  status: "pending" | "approved" | "cancelled";
  reviewedBy: string | null;
  cancelReason: string | null;
  processApprovedBy: string | null;
  processApprovedQty: number | null;
  processApprovedAt: Date | null;
  isUrgent: boolean;
  createdAt: Date;
  reviewedAt: Date | null;
};

type OrderSnapshot = {
  orderID: string;
  fluteType: string;
  sizeW: number;
  sizeL: number;
  qty: number;
  bqComment: string;
  trackingId?: string;
};

type ActionData = {
  jobNo: string | null;
  usedQty: number;
  purpose: "job" | "old_stock";
  newQty: number;
  masterCard?: string | null;
  boardSizeW?: number | null;
  boardSizeL?: number | null;
  scores?: string | null;
  targetBlackQty?: number;
};

function RequestCard({
  req,
  onApprove,
  onCancel,
  onProcessApprove,
  onToggleUrgent,
  onEditTargetBlack,
  isProcessing,
  canApprove,
  canCancel,
  canProcessApprove,
  currentWorkerID,
}: {
  req: PendingRequest;
  onApprove: (id: number, approvedQty?: number) => void;
  onCancel: (id: number, reason: string) => void;
  onProcessApprove: (id: number, processApprovedQty?: number) => void;
  onToggleUrgent: (id: number) => void;
  onEditTargetBlack: (id: number, newQty: number, remark: string) => void;
  isProcessing: boolean;
  canApprove: boolean;
  canCancel: boolean;
  canProcessApprove: boolean;
  currentWorkerID?: string;
}) {
  // Cancel reason dialog state (local to card)
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReasonLocal, setCancelReasonLocal] = useState("");
  // Approve with qty dialog state (local to card)
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvedQtyLocal, setApprovedQtyLocal] = useState("");
  // Process Approve dialog state (local to card)
  const [showProcessApproveDialog, setShowProcessApproveDialog] = useState(false);
  const [processApprovedQtyLocal, setProcessApprovedQtyLocal] = useState("");
  // Process-blocked cancel dialog (Level 1 trying to cancel a process-approved request)
  const [showProcessBlockedDialog, setShowProcessBlockedDialog] = useState(false);
  // Edit Target Black dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editQtyLocal, setEditQtyLocal] = useState("");
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [editRemarkLocal, setEditRemarkLocal] = useState("");

  let snapshot: OrderSnapshot | null = null;
  let action: ActionData | null = null;
  try { snapshot = JSON.parse(req.orderSnapshot); } catch { /* ignore */ }
  try { if (req.actionData) action = JSON.parse(req.actionData); } catch { /* ignore */ }

  const isDelete = req.type === "delete";
  const isPending = req.status === "pending";
  const isProcessApproved = !!req.processApprovedBy;

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${
      req.status === "approved" ? "bg-green-50 border-green-200" :
      req.status === "cancelled" ? "bg-gray-50 border-gray-200 opacity-70" :
      "bg-white border-border shadow-sm"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDelete ? "bg-red-100" : "bg-blue-100"}`}>
            {isDelete ? <Trash2 size={14} className="text-red-600" /> : <Zap size={14} className="text-blue-600" />}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {isDelete ? "Delete Request" : "NPRM Modify Order"}
            </p>
            {req.isUrgent && isPending && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700 inline-flex items-center gap-1 mt-1">
                <Flag size={12} className="fill-red-700" /> Order is Urgent
              </span>
            )}
          </div>
        </div>
        {/* Single Status Badge - Show ONLY current stage */}
        <div className="flex-shrink-0">
          {req.status === "cancelled" ? (
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-gray-200 text-gray-600 flex items-center gap-1.5">
              <XCircle size={14} /> Cancelled
            </span>
          ) : req.status === "approved" ? (
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-green-100 text-green-700 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Approved
            </span>
          ) : isProcessApproved ? (
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-purple-100 text-purple-700 flex items-center gap-1.5">
              <Clock size={14} /> In Process
            </span>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-orange-100 text-orange-700 flex items-center gap-1.5">
              <AlertCircle size={14} /> Pending
            </span>
          )}
        </div>
      </div>



      {/* Order info */}
      {snapshot && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Production Order</span>
            <span className="text-sm font-bold text-primary">{snapshot.orderID}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Flute Type</span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{snapshot.fluteType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Size</span>
            <span className="text-xs font-mono">{snapshot.sizeW}×{snapshot.sizeL} mm</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">BQ</span>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-semibold">{snapshot.bqComment}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Current Qty</span>
            <span className="text-sm font-semibold">{req.processApprovedQty ? `${snapshot.qty - req.processApprovedQty} pcs` : `${snapshot.qty} pcs`}</span>
          </div>
        </div>
      )}

      {/* Action details for used_update */}
      {!isDelete && action && (
        <div className={`rounded-lg p-3 space-y-1.5 ${action.purpose === "old_stock" ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}>
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            {action.purpose === "old_stock" ? "Old Stock Clear" : "Order Description"}
          </p>
          {action.jobNo && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Job No</span>
              <span className="text-xs font-mono font-bold">{action.jobNo}</span>
            </div>
          )}
          {/* Extra fields: MasterCard, Board Size, Scores */}
          {action.purpose === "job" && (
            <>
              {action.masterCard && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Master Card</span>
                  <span className="text-xs font-mono font-semibold">{action.masterCard}</span>
                </div>
              )}
              {(action.boardSizeW || action.boardSizeL) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Board Size</span>
                  <span className="text-xs font-mono">{action.boardSizeW ?? "—"}×{action.boardSizeL ?? "—"} mm</span>
                </div>
              )}
              {action.scores && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Scores</span>
                  <span className="text-xs font-mono">{action.scores}</span>
                </div>
              )}
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Target Black</span>
            <span className="text-sm font-semibold text-orange-600">{action.usedQty} pcs</span>
          </div>
          {/* Inline Edit History in order details */}
          <InlineEditHistory requestId={req.id} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">In Process Qty</span>
            <span className="text-sm font-semibold text-purple-700">{req.processApprovedQty ? `${req.processApprovedQty} pcs` : "N/A"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Balance</span>
            <span className="text-sm font-semibold text-green-700">{req.processApprovedQty ? `${snapshot && snapshot.qty - req.processApprovedQty} pcs` : `${snapshot && snapshot.qty} pcs`}</span>
          </div>
        </div>
      )}

      {/* Request Lifecycle */}
      <div className="space-y-2 py-2 border-t border-border">
        <div className="text-xs">
          <p className="text-muted-foreground">
            <span className="font-semibold">Request by</span> {req.workerName} · {new Date(req.createdAt).toLocaleString()}
          </p>
        </div>
        {isProcessApproved && req.processApprovedBy && (
          <div className="text-xs">
            <p className="text-muted-foreground">
              <span className="font-semibold">In Process by</span> {req.processApprovedBy} · {new Date(req.processApprovedAt || req.createdAt).toLocaleString()}
            </p>
          </div>
        )}
        {req.status === "approved" && req.reviewedBy && (
          <div className="text-xs">
            <p className="text-muted-foreground">
              <span className="font-semibold">Approved by</span> {req.reviewedBy} · {new Date(req.reviewedAt || req.createdAt).toLocaleString()}
            </p>
          </div>
        )}
        {req.status === "cancelled" && req.reviewedBy && (
          <div className="text-xs space-y-1.5">
            <p className="text-muted-foreground">
              <span className="font-semibold">Cancel by</span> {req.reviewedBy} · {new Date(req.reviewedAt || req.createdAt).toLocaleString()}
            </p>
            {req.cancelReason && (
              <p className="text-muted-foreground">
                <span className="font-semibold">Cancel Reason:</span> {req.cancelReason}
              </p>
            )}
          </div>
        )}
      </div>



      {/* Actions - Update Info Dropdown */}
      {isPending && (canCancel || canApprove || canProcessApprove) && (
        <div className="flex justify-end pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <MoreVertical size={14} />}
                Update Info
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 p-1">
              {canCancel && (
                <DropdownMenuItem
                  onClick={() => {
                    const isOwnRequest = req.requestedBy === currentWorkerID;
                    if (!canApprove && isProcessApproved) {
                      setShowProcessBlockedDialog(true);
                    } else if (canProcessApprove && isProcessApproved && !isOwnRequest) {
                      setShowProcessBlockedDialog(true);
                    } else {
                      setShowCancelDialog(true);
                      setCancelReasonLocal("");
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <XCircle size={16} className="text-red-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">Cancel</span>
                </DropdownMenuItem>
              )}
              {canProcessApprove && !isProcessApproved && (
                <DropdownMenuItem
                  onClick={() => {
                    setShowProcessApproveDialog(true);
                    setProcessApprovedQtyLocal("");
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <PlayCircle size={16} className="text-purple-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">Process</span>
                </DropdownMenuItem>
              )}
              {canApprove && isProcessApproved && (
                <DropdownMenuItem
                  onClick={() => {
                    setShowApproveDialog(true);
                    setApprovedQtyLocal(action?.usedQty ? String(action.usedQty) : "");
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">Approved</span>
                </DropdownMenuItem>
              )}
              {req.requestedBy === currentWorkerID && req.type === "used_update" && (
                <DropdownMenuItem
                  onClick={() => onToggleUrgent(req.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                >
                  <Flag size={16} className={req.isUrgent ? "text-orange-600 fill-orange-600" : "text-orange-600"} />
                  <span className="text-sm font-medium text-foreground">{req.isUrgent ? "Remove Urgent" : "Mark Urgent"}</span>
                </DropdownMenuItem>
              )}
              {req.type === "used_update" && (
                (req.status === "pending" && !isProcessApproved) ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setShowEditDialog(true);
                      setEditQtyLocal(action?.usedQty ? String(action.usedQty) : "");
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Edit3 size={16} className="text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">Edit Target Black</span>
                  </DropdownMenuItem>
                ) : (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-100 cursor-not-allowed select-none border border-gray-200">
                          <Edit3 size={16} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-400">Edit Target Black</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs max-w-[200px] text-center">
                        {isProcessApproved && req.processApprovedBy
                          ? <><span className="font-semibold">{req.processApprovedBy}</span> မှ In Process လုပ်ဆောင်နေသောကြောင့် ပြင်ဆင်၍မရပါ</>
                          : "Pending status တွင်သာ ပြင်ဆင်နိုင်သည်"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Process Approve Dialog */}
      {showProcessApproveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <PlayCircle size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Process Approved</h3>
                  <p className="text-xs text-gray-500">Confirm how many pcs you used from this order</p>
                </div>
              </div>
              {!isDelete && action && (
                <div className="mb-4 space-y-3">
                  {/* Target Black QTY info from Level 1 request */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>{req.workerName}</strong> requested Target Black QTY of <strong>{action.usedQty} pcs</strong> from Production Order <strong>{snapshot?.orderID ?? "—"}</strong>.
                    </p>
                  </div>
                  {/* Needed slit calculation */}
                  {(() => {
                    const bW = action.boardSizeW;
                    const bL = action.boardSizeL;
                    const sW = snapshot?.sizeW;
                    const sL = snapshot?.sizeL;
                    const tgt = action.usedQty;
                    if (bW && bL && sW && sL && tgt) {
                      const ALLOWED_GAP = 50;
                      const calcAxis = (prod: number, job: number) => {
                        if (prod < job) return 0;
                        if (prod === job) return 1;
                        const usable = prod - ALLOWED_GAP;
                        if (usable < job) return 0;
                        return Math.floor(usable / job);
                      };
                      const pcsPerSlit = calcAxis(sW, bW) * calcAxis(sL, bL);
                      if (pcsPerSlit > 0) {
                        const neededSlit = Math.ceil(tgt / pcsPerSlit);
                        return (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-purple-700">needed slit ({neededSlit} pcs) this order</p>
                          </div>
                        );
                      }
                    }
                    return (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500">needed slit (N/A) this order</p>
                      </div>
                    );
                  })()}
                  <div>
                    <label className="block text-xs font-semibold text-purple-700 mb-1">How many pcs did you use from Order {snapshot?.orderID ?? ""}? <span className="text-destructive">*</span></label>
                    <input
                      type="number"
                      min={1}
                      value={processApprovedQtyLocal}
                      onChange={e => setProcessApprovedQtyLocal(e.target.value)}
                      placeholder={`e.g. ${action.usedQty}`}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    {!processApprovedQtyLocal && <p className="text-xs text-red-500 mt-1">This field is required before confirming.</p>}
                  </div>
                </div>
              )}
              {isDelete && <p className="text-sm text-gray-600 mb-4">Mark this delete request as currently being processed. Level 2 must still give final approval.</p>}
              <p className="text-xs text-purple-700 bg-purple-50 rounded-lg p-2 mb-4">
                This marks the request as "In Process". Level 2 must still give final Approve or Cancel.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowProcessApproveDialog(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                <button
                  onClick={() => {
                    if (!isDelete && !processApprovedQtyLocal) {
                      toast.error("Please enter how many pcs you used before confirming.");
                      return;
                    }
                    const pq = processApprovedQtyLocal ? parseInt(processApprovedQtyLocal) : undefined;
                    setShowProcessApproveDialog(false);
                    onProcessApprove(req.id, pq);
                  }}
                  className="flex-1 bg-purple-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-purple-700"
                >Confirm Process</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve with Qty Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Approve Request</h3>
              </div>
              {!isDelete && action && (
                <div className="mb-4 space-y-3">
                  <p className="text-sm text-gray-600">Requested Qty: <strong>{action.usedQty} pcs</strong></p>
                  {/* Process qty conflict warning */}
                  {req.processApprovedQty && req.processApprovedQty !== action.usedQty && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800">
                          <p className="font-semibold mb-1">Quantity Mismatch</p>
                          <p>Requested Qty: <strong>{action.usedQty} pcs</strong> but <strong>{req.processApprovedBy}</strong> processed only <strong>{req.processApprovedQty} pcs</strong>.</p>
                          <p className="mt-1">Would you like to change the approved qty? Leave blank to use the requested qty ({action.usedQty} pcs).</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Approved Qty (optional — leave blank to use requested)</label>
                    <input
                      type="number"
                      min={1}
                      value={approvedQtyLocal}
                      onChange={e => setApprovedQtyLocal(e.target.value)}
                      placeholder={req.processApprovedQty ? String(req.processApprovedQty) : String(action.usedQty)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                    {req.processApprovedQty && req.processApprovedQty !== action.usedQty && (
                      <p className="text-xs text-gray-500 mt-1">Placeholder shows process qty ({req.processApprovedQty} pcs) as suggestion.</p>
                    )}
                  </div>
                </div>
              )}
              {isDelete && <p className="text-sm text-gray-600 mb-4">Are you sure you want to approve this delete request? This action cannot be undone.</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowApproveDialog(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                <button
                  onClick={() => { const aq = approvedQtyLocal ? parseInt(approvedQtyLocal) : undefined; setShowApproveDialog(false); onApprove(req.id, aq); }}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700"
                >Confirm Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel with Reason Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle size={20} className="text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Cancel Request</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">Please provide a reason for cancelling this request.</p>
              <textarea
                value={cancelReasonLocal}
                onChange={e => setCancelReasonLocal(e.target.value)}
                placeholder="Enter cancel reason..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCancelDialog(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                <button
                  onClick={() => { if (!cancelReasonLocal.trim()) return; setShowCancelDialog(false); onCancel(req.id, cancelReasonLocal.trim()); }}
                  disabled={!cancelReasonLocal.trim()}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >Confirm Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process-Blocked Cancel Dialog — shown when Level 1 tries to cancel a process-approved request */}
      {showProcessBlockedDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Can't Deliver your cancel</h3>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800 leading-relaxed">
                  Your request is we are decline. Order Modified NPRM has already been processed by{" "}
                  <strong>({req.processApprovedBy})</strong>. You cannot cancel it at this stage.
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  Please contact your Administrator if you need this request to be cancelled.
                </p>
              </div>
              <button
                onClick={() => setShowProcessBlockedDialog(false)}
                className="w-full bg-gray-800 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-700"
              >
                OK, Understood
              </button>
              <a
                href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Contact Administrator
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Edit Target Black Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Edit3 size={18} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Edit Target Black Qty</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Current Target Black: <strong>{action?.targetBlackQty ?? action?.usedQty ?? 0} pcs</strong>
              </p>
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-700 mb-1 block">New Target Black Qty (pcs)</label>
                <input
                  type="number"
                  min="0"
                  value={editQtyLocal}
                  onChange={e => setEditQtyLocal(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  placeholder="Enter new qty"
                  autoFocus
                />
              </div>
              {/* Edit History */}
              <EditHistorySection requestId={req.id} />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const qty = parseInt(editQtyLocal);
                    if (isNaN(qty) || qty < 0) {
                      toast.error("Please enter a valid quantity.");
                      return;
                    }
                    setShowEditConfirm(true);
                  }}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Confirmation Dialog */}
      {showEditConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle size={22} className="text-amber-600" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-center text-base mb-2">Confirm Edit</h3>
              <p className="text-xs text-center text-muted-foreground mb-4">
                Are you sure you want to change Target Black Qty?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Target Black Qty</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-semibold text-red-500 line-through">{action?.targetBlackQty ?? action?.usedQty ?? 0} pcs</span>
                  <span className="text-gray-400">&rarr;</span>
                  <span className="text-sm font-bold text-green-600">{editQtyLocal} pcs</span>
                </div>
              </div>
              {/* Remark input */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Reason for Edit <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editRemarkLocal}
                  onChange={e => setEditRemarkLocal(e.target.value)}
                  placeholder="Enter reason for editing Target Black Qty..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none"
                  autoFocus
                />
                {editRemarkLocal.trim() === "" && (
                  <p className="text-[10px] text-red-500 mt-1">Remark is required to proceed.</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowEditConfirm(false); setEditRemarkLocal(""); }}
                  className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50"
                >
                  Go Back
                </button>
                <button
                  disabled={editRemarkLocal.trim() === ""}
                  onClick={() => {
                    const qty = parseInt(editQtyLocal);
                    onEditTargetBlack(req.id, qty, editRemarkLocal.trim());
                    setShowEditConfirm(false);
                    setShowEditDialog(false);
                    setEditRemarkLocal("");
                  }}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Edit History Section Component
// Compact inline edit history shown inside the order details card
function InlineEditHistory({ requestId }: { requestId: number }) {
  const historyQuery = trpc.pendingRequests.getEditHistory.useQuery({ requestId });
  const history = (historyQuery.data ?? []) as Array<{ id: number; editedBy: string; editedAt: string | Date; oldQty: number; newQty: number; remark?: string | null }>;
  if (history.length === 0) return null;
  return (
    <>
      {history.map((edit) => (
        <div key={edit.id} className="mt-1 rounded-md bg-orange-50 border border-orange-100 px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-orange-700 font-semibold">Edited by {edit.editedBy}</span>
            <span className="text-[10px] text-orange-500">
              <span className="line-through text-red-400">{edit.oldQty}</span>
              {" → "}
              <span className="font-bold text-green-600">{edit.newQty} pcs</span>
            </span>
          </div>
          <div className="text-[10px] text-orange-400 mt-0.5">
            {new Date(edit.editedAt).toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" })}{" "}
            {new Date(edit.editedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
          </div>
          {edit.remark && (
            <p className="text-[10px] text-gray-600 mt-0.5 italic">&ldquo;{edit.remark}&rdquo;</p>
          )}
        </div>
      ))}
    </>
  );
}

function EditHistorySection({ requestId }: { requestId: number }) {
  const historyQuery = trpc.pendingRequests.getEditHistory.useQuery({ requestId });
  const history = historyQuery.data ?? [];
  
  if (history.length === 0) return null;
  
  return (
    <div className="mb-4 border-t border-gray-100 pt-3">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Edit History</p>
      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {history.map((edit: { id: number; editedBy: string; editedAt: string | Date; oldQty: number; newQty: number; remark?: string | null }) => (
          <div key={edit.id} className="bg-blue-50/50 rounded-lg px-2.5 py-1.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px]">
                <span className="font-medium text-gray-800">Edit by {edit.editedBy}</span>
                <span className="text-gray-400 mx-1">&bull;</span>
                <span className="text-gray-500">{new Date(edit.editedAt).toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" })} {new Date(edit.editedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="text-[11px] font-semibold">
                <span className="text-red-500 line-through">{edit.oldQty}</span>
                <span className="text-gray-400 mx-1">&rarr;</span>
                <span className="text-green-600">{edit.newQty} pcs</span>
              </div>
            </div>
            {edit.remark && (
              <p className="text-[10px] text-gray-500 mt-0.5 italic">&ldquo;{edit.remark}&rdquo;</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ApprovalCenter() {
  const { worker } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "cancelled" | undefined>("pending");
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [jobNoSearch, setJobNoSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  const userLevel = worker?.userLevel ?? "2";
  const canApprove = userLevel === "2";
  const canProcessApprove = userLevel === "1.1" || userLevel === "2";
  const isLevel1 = userLevel === "1";

  const requestsQuery = trpc.pendingRequests.list.useQuery(
    { status: statusFilter },
    { refetchInterval: 10000 }
  );
  const actionLogQuery = trpc.pendingRequests.actionLog.useQuery(
    { limit: 100 },
    { enabled: activeTab === "history" }
  );
  const utils = trpc.useUtils();
  const approveMutation = trpc.pendingRequests.approve.useMutation();
  const cancelMutation = trpc.pendingRequests.cancel.useMutation();
  const processApproveMutation = trpc.pendingRequests.processApprove.useMutation();
  const toggleUrgentMutation = trpc.pendingRequests.toggleUrgent.useMutation();
  const notifyAll = trpc.push.sendToAll.useMutation();
  const createNotif = trpc.notifications.create.useMutation();

  const allRequests = (requestsQuery.data ?? []) as unknown as PendingRequest[];
  
  // Time filter helper
  const getTimeFilterRange = (filter: string): { start: Date; end: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (filter) {
      case "today":
        return { start: today, end: new Date(today.getTime() + 86400000) };
      case "yesterday": {
        const yesterday = new Date(today.getTime() - 86400000);
        return { start: yesterday, end: today };
      }
      case "last_week": {
        const weekAgo = new Date(today.getTime() - 7 * 86400000);
        return { start: weekAgo, end: new Date(today.getTime() + 86400000) };
      }
      case "last_month": {
        const monthAgo = new Date(today.getTime() - 30 * 86400000);
        return { start: monthAgo, end: new Date(today.getTime() + 86400000) };
      }
      default: {
        // Check if it's a month filter like "2026-07"
        const monthMatch = filter.match(/^(\d{4})-(\d{2})$/);
        if (monthMatch) {
          const year = parseInt(monthMatch[1]);
          const month = parseInt(monthMatch[2]) - 1;
          return { start: new Date(year, month, 1), end: new Date(year, month + 1, 1) };
        }
        return null; // "all" - no filter
      }
    }
  };

  // Generate available months from requests
  const availableMonths = useMemo(() => {
    const months = new Map<string, number>();
    allRequests.forEach(req => {
      const d = new Date(req.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.set(key, (months.get(key) || 0) + 1);
    });
    return Array.from(months.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allRequests]);

  // Time filter counts
  const timeFilterCounts = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);
    let todayCount = 0, yesterdayCount = 0, weekCount = 0, monthCount = 0;
    allRequests.forEach(req => {
      const d = new Date(req.createdAt);
      if (d >= today) todayCount++;
      if (d >= yesterday && d < today) yesterdayCount++;
      if (d >= weekAgo) weekCount++;
      if (d >= monthAgo) monthCount++;
    });
    return { today: todayCount, yesterday: yesterdayCount, week: weekCount, month: monthCount };
  }, [allRequests]);

  // Fetch ALL requests (no status filter) for Job No cross-status search
  const allRequestsUnfiltered = (trpc.pendingRequests.list.useQuery(
    { status: undefined },
    { enabled: jobNoSearch.length === 8, refetchInterval: false }
  ).data ?? []) as unknown as PendingRequest[];

  // Filter by Job No and time filter
  const requests = useMemo(() => {
    // When Job No search is active (8 digits), search across ALL statuses
    let pool = jobNoSearch.length === 8 ? allRequestsUnfiltered : allRequests;
    let filtered = pool;
    
    // Apply time filter
    const range = getTimeFilterRange(timeFilter);
    if (range) {
      filtered = filtered.filter(req => {
        const d = new Date(req.createdAt);
        return d >= range.start && d < range.end;
      });
    }
    
    // Apply Job No search — only when exactly 8 digits entered
    if (jobNoSearch.length === 8) {
      filtered = filtered.filter(req => {
        try {
          const action = JSON.parse(req.actionData || "{}") as ActionData;
          if (!action.jobNo) return false;
          return action.jobNo === jobNoSearch;
        } catch {
          return false;
        }
      });
    }
    
    return filtered;
  }, [allRequests, allRequestsUnfiltered, statusFilter, jobNoSearch, timeFilter]);

  // Notification sound when new pending requests arrive
  const { playChime } = useNotificationSound();
  const prevPendingCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (statusFilter !== "pending") return;
    const currentCount = requests.filter(r => r.status === "pending").length;
    if (prevPendingCountRef.current !== null && currentCount > prevPendingCountRef.current) {
      playChime();
      toast.info(`${currentCount - prevPendingCountRef.current} new pending request(s) arrived.`);
    }
    prevPendingCountRef.current = currentCount;
  }, [requests, statusFilter]);

  const handleApprove = async (id: number, approvedQty?: number) => {
    if (!worker || !canApprove) return;
    setProcessingId(id);
    try {
      const req = allRequests.find(r => r.id === id);
      const snap = req ? JSON.parse(req.orderSnapshot) as OrderSnapshot : null;
      await approveMutation.mutateAsync({ id, reviewerWorkerID: worker.workerID, approvedQty });
      toast.success("Request approved and action executed.");
      const actionDataForApprove = req?.actionData ? JSON.parse(req.actionData) : null;
      notifyAll.mutate({
        title: "Order Request Approved",
        body: snap
          ? req?.type === "delete"
            ? `Purchase Order (${snap.orderID}) delete request has been Approved by ${worker.workerID}.`
            : `Purchase Order is Production Order (${snap.orderID}) to use it for NPRM Modify Order Job No (${actionDataForApprove?.jobNo ?? "N/A"}) ${approvedQty ?? actionDataForApprove?.usedQty ?? 0} pcs. Request Approved by ${worker.workerID}.`
          : `Request #${id} has been Approved by ${worker.workerID}.`,
        type: "order",
        url: "/stock-history",
        tag: "approved-" + (snap?.orderID ?? id),
        orderID: snap?.orderID,
        jobNo: actionDataForApprove?.jobNo,
        requireInteraction: true,
      });
      if (snap) {
        const actionDataParsed = req?.actionData ? JSON.parse(req.actionData) : null;
        createNotif.mutate({
          type: "order_approved",
          title: `Purchase Order ${snap.orderID} — Approved`,
          message: req?.type === "delete"
            ? `Order Delete request for Production Order (${snap.orderID}) has been Approved by ${worker.workerID}. Order will be removed from stock.`
            : `Purchase Order is Production Order (${snap.orderID}) to use it for NPRM Modify Order Job No (${actionDataParsed?.jobNo ?? "N/A"}) ${approvedQty ?? actionDataParsed?.usedQty ?? 0} pcs. Request Approved by ${worker.workerID}.`,
          orderID: snap.orderID,
          jobNo: actionDataParsed?.jobNo,
          qty: approvedQty ?? actionDataParsed?.usedQty,
          fluteType: snap.fluteType,
          workerID: req?.requestedBy,
          trackingId: snap.trackingId,
        });
      }
      utils.pendingRequests.list.invalidate();
      utils.orders.list.invalidate();
      if (activeTab === "history") utils.pendingRequests.actionLog.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to approve request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id: number, reason: string) => {
    if (!worker) return;
    setProcessingId(id);
    try {
      const req = allRequests.find(r => r.id === id);
      const snap = req ? JSON.parse(req.orderSnapshot) as OrderSnapshot : null;
      await cancelMutation.mutateAsync({ id, reviewerWorkerID: worker.workerID, cancelReason: reason });
      toast.success("Request cancelled. No changes made.");
      notifyAll.mutate({
        title: "Order Request Cancelled",
        body: snap
          ? `Purchase Order (${snap.orderID}) ${req?.type === "delete" ? "delete" : "used update"} request has been Cancelled by ${worker.workerID}. Reason: ${reason}`
          : `Request #${id} has been Cancelled by ${worker.workerID}.`,
        type: "order",
        url: "/stock-history",
        tag: "cancelled-" + (snap?.orderID ?? id),
        orderID: snap?.orderID,
        requireInteraction: false,
      });
      if (snap) {
        createNotif.mutate({
          type: "order_cancelled",
          title: `Purchase Order ${snap.orderID} — Cancelled`,
          message: `Purchase Order request for Production Order (${snap.orderID}) has been Cancelled by ${worker.workerID}. Reason: ${reason}`,
          orderID: snap.orderID,
          fluteType: snap.fluteType,
          workerID: req?.requestedBy,
          trackingId: snap.trackingId,
        });
      }
      utils.pendingRequests.list.invalidate();
      if (activeTab === "history") utils.pendingRequests.actionLog.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to cancel request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcessApprove = async (id: number, processApprovedQty?: number) => {
    if (!worker || !canProcessApprove) return;
    setProcessingId(id);
    try {
      const req = allRequests.find(r => r.id === id);
      const snap = req ? JSON.parse(req.orderSnapshot) as OrderSnapshot : null;
      await processApproveMutation.mutateAsync({ id, reviewerWorkerID: worker.workerID, processApprovedQty });
      toast.success("Request marked as In Process. Level 2 will give final approval.");
      const actionDataForProcess = req?.actionData ? JSON.parse(req.actionData) : null;
      notifyAll.mutate({
        title: "Order Request In Process",
        body: snap
          ? `Purchase Order is Production Order (${snap.orderID}) to use it for NPRM Modify Order Job No (${actionDataForProcess?.jobNo ?? "N/A"}) ${processApprovedQty ?? actionDataForProcess?.usedQty ?? 0} pcs. Marked In Process by ${worker.workerID}. Awaiting Level 2 final approval.`
          : `Request #${id} marked In Process by ${worker.workerID}.`,
        type: "approval",
        url: "/approval-center",
        tag: "in-process-" + (snap?.orderID ?? id),
        orderID: snap?.orderID,
        jobNo: actionDataForProcess?.jobNo,
        requireInteraction: true,
      });
      if (snap) {
        const actionDataParsed2 = req?.actionData ? JSON.parse(req.actionData) : null;
        createNotif.mutate({
          type: "order_in_process",
          title: `Purchase Order ${snap.orderID} — In Process`,
          message: `Purchase Order is Production Order (${snap.orderID}) to use it for NPRM Modify Order Job No (${actionDataParsed2?.jobNo ?? "N/A"}) ${processApprovedQty ?? actionDataParsed2?.usedQty ?? 0} pcs. Request marked In Process by ${worker.workerID}. Awaiting Level 2 final approval.`,
          orderID: snap.orderID,
          jobNo: actionDataParsed2?.jobNo,
          qty: processApprovedQty ?? actionDataParsed2?.usedQty,
          fluteType: snap.fluteType,
          workerID: req?.requestedBy,
          trackingId: snap.trackingId,
        });
      }
      utils.pendingRequests.list.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to process-approve request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleUrgent = async (id: number) => {
    if (!worker) return;
    try {
      await toggleUrgentMutation.mutateAsync({ id, workerID: worker.workerID });
      toast.success("Urgent status updated.");
      utils.pendingRequests.list.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to update urgent status.");
    }
  };

  const editTargetBlackMutation = trpc.pendingRequests.editTargetBlackQty.useMutation();

  const handleEditTargetBlack = async (id: number, newQty: number, remark: string) => {
    if (!worker) return;
    try {
      await editTargetBlackMutation.mutateAsync({ id, newQty, workerID: worker.workerID, remark });
      toast.success("Target Black Qty updated successfully.");
      utils.pendingRequests.list.invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to update Target Black Qty.");
    }
  };

  const pendingCount = statusFilter === "pending" ? requests.length : undefined;

  return (
    <AppLayout pageTitle="NPRM Modify Order">
      <main className="container lg:max-w-none lg:px-8 py-5">
        <div></div>

        {/* Level info banner */}
        {isLevel1 && (
          <div className="flex items-start gap-2.5 bg-gradient-to-r from-orange-50 to-amber-50/50 border border-orange-200/80 rounded-xl p-3.5 mb-5 shadow-sm">
            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info size={14} className="text-orange-600" />
            </div>
            <p className="text-xs text-orange-700 leading-relaxed">
              <strong className="text-orange-800">Level 1</strong> — View pending requests and cancel your own. Level 2 users approve requests.
            </p>
          </div>
        )}
        {canProcessApprove && userLevel === "1.1" && (
          <div className="flex items-start gap-2.5 bg-gradient-to-r from-purple-50 to-violet-50/50 border border-purple-200/80 rounded-xl p-3.5 mb-5 shadow-sm">
            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info size={14} className="text-purple-600" />
            </div>
            <p className="text-xs text-purple-700 leading-relaxed">
              <strong className="text-purple-800">Level 1.1</strong> — Mark requests as <strong>In Process</strong>. Level 2 gives final approval.
            </p>
          </div>
        )}
        {canProcessApprove && userLevel === "2" && (
          <div className="flex items-start gap-2.5 bg-gradient-to-r from-emerald-50 to-green-50/50 border border-emerald-200/80 rounded-xl p-3.5 mb-5 shadow-sm">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info size={14} className="text-emerald-600" />
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              <strong className="text-emerald-800">Level 2</strong> — Mark as <strong>In Process</strong> first, then give final <strong>Approve or Cancel</strong>.
            </p>
          </div>
        )}

        {/* Main tab: Requests / History */}
        <div className="flex gap-1 mb-5 bg-gray-100/80 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${activeTab === "requests" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Purchase Orders
            {pendingCount !== undefined && pendingCount > 0 && (
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${activeTab === "history" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Action History
          </button>
        </div>

        {activeTab === "requests" && (
          <>
            {/* Status & Time Filters */}
            <div className="flex gap-3 mb-4 items-center flex-wrap">
              {/* Status Select */}
              <Select
                value={statusFilter ?? "all"}
                onValueChange={(val) => {
                  setStatusFilter(val === "all" ? undefined : val as "pending" | "approved" | "cancelled");
                  setJobNoSearch("");
                }}
              >
                <SelectTrigger className="w-[150px] h-9 text-xs font-semibold">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                  <SelectItem value="approved">✅ Approved</SelectItem>
                  <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                  <SelectItem value="all">📋 All</SelectItem>
                </SelectContent>
              </Select>

              {/* Time Filter Select */}
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[180px] h-9 text-xs font-semibold">
                  <Calendar size={14} className="mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time ({allRequests.length})</SelectItem>
                  <SelectItem value="today">Today ({timeFilterCounts.today})</SelectItem>
                  <SelectItem value="yesterday">Yesterday ({timeFilterCounts.yesterday})</SelectItem>
                  <SelectItem value="last_week">Last 7 Days ({timeFilterCounts.week})</SelectItem>
                  <SelectItem value="last_month">Last 30 Days ({timeFilterCounts.month})</SelectItem>
                  {availableMonths.map(([monthKey, count]) => {
                    const [y, m] = monthKey.split("-");
                    const monthName = new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en", { month: "short", year: "numeric" });
                    return (
                      <SelectItem key={monthKey} value={monthKey}>
                        {monthName} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Refresh button */}
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  await utils.pendingRequests.list.invalidate();
                  toast.info("Refreshing requests...");
                  setTimeout(() => setIsRefreshing(false), 700);
                }}
                className="ml-auto text-muted-foreground hover:text-primary p-2 rounded-xl hover:bg-primary/5 disabled:opacity-60 transition-all border border-transparent hover:border-primary/20"
                title="Refresh requests"
                disabled={isRefreshing}
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Request count summary */}
            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{requests.length}</span> request{requests.length !== 1 ? "s" : ""} found
              {timeFilter !== "all" && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  {timeFilter === "today" ? "Today" : timeFilter === "yesterday" ? "Yesterday" : timeFilter === "last_week" ? "Last 7 Days" : timeFilter === "last_month" ? "Last 30 Days" : (() => { const [y, m] = timeFilter.split("-"); return new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en", { month: "short", year: "numeric" }); })()}
                </span>
              )}
            </div>
            
            {/* Job No Search Bar — always visible */}
            <div className="w-full mb-5 max-w-sm">
              <div className="relative group">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Search by Job No (e.g. 02134567)..."
                  value={jobNoSearch}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
                    setJobNoSearch(val);
                  }}
                  className={`w-full pl-10 pr-9 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-white shadow-sm transition-all ${
                    jobNoSearch.length > 0 && jobNoSearch.length < 8
                      ? "border-red-400 focus:ring-red-200 focus:border-red-500"
                      : "border-gray-200 focus:ring-primary/20 focus:border-primary"
                  }`}
                />
                {jobNoSearch && (
                  <button
                    onClick={() => setJobNoSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {jobNoSearch.length > 0 && jobNoSearch.length < 8 && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Job No must be exactly 8 digits ({jobNoSearch.length}/8)
                </p>
              )}
              {jobNoSearch.length === 8 && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Searching for Job No: {jobNoSearch}
                </p>
              )}
            </div>

            {requestsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl animate-pulse" style={{animationDelay: `${i * 150}ms`}} />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                {jobNoSearch.length === 8 ? (
                  <>
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">No results found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No request with Job No <span className="font-mono font-bold text-gray-800">{jobNoSearch}</span> found.
                    </p>
                    <button
                      onClick={() => setJobNoSearch("")}
                      className="mt-3 text-xs text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <Clock size={30} className="text-muted-foreground/30" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      No {statusFilter ?? ""} requests found
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">New requests will appear here automatically</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    onApprove={handleApprove}
                    onCancel={handleCancel}
                    onProcessApprove={handleProcessApprove}
                    onToggleUrgent={handleToggleUrgent}
                    onEditTargetBlack={handleEditTargetBlack}
                    isProcessing={processingId === req.id}
                    canApprove={canApprove}
                    canCancel={canApprove || canProcessApprove || req.requestedBy === worker?.workerID}
                    canProcessApprove={canProcessApprove}
                    currentWorkerID={worker?.workerID}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Recent Usage Events</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Latest 200 actions</p>
              </div>
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  await utils.pendingRequests.actionLog.invalidate();
                  toast.info("Refreshing history...");
                  setTimeout(() => setIsRefreshing(false), 700);
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary px-3 py-2 rounded-xl hover:bg-primary/5 disabled:opacity-60 transition-all border border-transparent hover:border-primary/20"
                title="Refresh history"
                disabled={isRefreshing}
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {actionLogQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl animate-pulse" style={{animationDelay: `${i * 100}ms`}} />)}
              </div>
            ) : !actionLogQuery.data || actionLogQuery.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Clock size={30} className="text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">No action history yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Approved and cancelled actions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(actionLogQuery.data as unknown as Array<{id:number;actionType:string;requestId:number;requestType:"delete"|"used_update";orderID:string;requestedBy:string;reviewedBy:string;approvedQty:number|null;requestedQty:number|null;cancelReason:string|null;details:string|null;createdAt:Date}>).map(log => {
                  const isApprove = log.actionType === "approve";
                  const isCancel = log.actionType === "cancel";
                  
                  let actionData: any = null;
                  if (log.details) {
                    try {
                      actionData = JSON.parse(log.details);
                    } catch { /* ignore */ }
                  }

                  let event: ActionHistoryEvent | null = null;

                  if (isApprove) {
                    event = {
                      type: "approved",
                      id: log.id,
                      jobNo: actionData?.jobNo || "N/A",
                      productionOrder: log.orderID,
                      usageQty: log.requestedQty || 0,
                      currentBalance: actionData?.currentBalance || 0,
                      newBalance: actionData?.newBalance || 0,
                      requestedBy: log.requestedBy,
                      approvedBy: log.reviewedBy,
                      createdAt: log.createdAt,
                    };
                  } else if (isCancel) {
                    event = {
                      type: "cancelled",
                      id: log.id,
                      jobNo: actionData?.jobNo,
                      productionOrder: log.orderID,
                      cancelReason: log.cancelReason || "No reason provided",
                      requestedBy: log.requestedBy,
                      cancelledBy: log.reviewedBy,
                      createdAt: log.createdAt,
                    };
                  }

                  return event ? (
                    <ActionHistoryCard key={log.id} event={event} />
                  ) : null;
                })}
              </div>
            )}
          </>
        )}
      </main>
    </AppLayout>
  );
}
