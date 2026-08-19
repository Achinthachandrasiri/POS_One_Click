// PayingPannel.jsx
// Pure UI layout only. All state/handlers are passed in as props from usePosHooks via mainScreen.jsx.
// No logic lives here.
//
// Holds: split payment amounts (cash/card/bank), the live balance readout
// (amount due from / change owed to the customer), note, and the four
// bill-level actions (Reset, Hold, Save with bill, Save without bill).
//
// TEMP DEBUG: onSaveWithBill's onClick logs before calling through — remove
// once the silent-failure bug is found.

const PAYMENT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank transfer" },
];

// Blocks characters that would let a number input accept a negative value
// or scientific notation (-, +, e/E) at the keystroke level — belt-and-braces
// alongside the numeric clamping that already happens in usePosHooks.
const blockInvalidNumberKeys = (e) => {
  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
};

const PayingPannel = ({
  paymentAmounts = { cash: 0, card: 0, bank: 0 },
  onPaymentAmountChange = () => { },
  totalPaid = 0,
  dueAmount = 0,
  changeAmount = 0,
  note,
  onNoteChange,
  onHoldBill,
  onReset,
  onSaveWithBill,
  onSaveWithoutBill,
}) => {
  return (
    <div className="p-3 flex flex-col gap-2.5">

      {/* Payment amounts - one input per method */}
      <div className="grid grid-cols-3 gap-1.5 shrink-0">
        {PAYMENT_TYPES.map((type) => (
          <div key={type.value} className="flex flex-col gap-1">
            <span className="text-[12px] text-slate-900">{type.label}</span>
            <input
              type="number"
              min="0"
              value={paymentAmounts[type.value] ?? 0}
              onChange={(e) => onPaymentAmountChange(type.value, e.target.value)}
              onKeyDown={blockInvalidNumberKeys}
              placeholder="0"
              className="w-full text-xs text-right border-2 border-slate-500 rounded-lg px-1.5 py-[12px] outline-none focus:border-[#1a6b7a]"
            />
          </div>
        ))}
      </div>

      {/* Balance - tendered vs. due/change. Only one of dueAmount/changeAmount
          is ever non-zero at a time (see calculatePaymentSummary). */}
      {totalPaid > 0 && (
        <div className="shrink-0 flex justify-between items-center rounded-lg px-3 py-2 bg-slate-100">
          <span className="text-[12px] text-slate-600">Tendered: Rs {totalPaid.toFixed(2)}</span>
          {changeAmount > 0 ? (
            <span className="text-sm font-medium text-emerald-600">
              Change Rs {changeAmount.toFixed(2)}
            </span>
          ) : dueAmount > 0 ? (
            <span className="text-sm font-medium text-red-600">
              Due Rs {dueAmount.toFixed(2)}
            </span>
          ) : (
            <span className="text-sm font-medium text-slate-600">Settled</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={onHoldBill}
          className="flex-1 text-sm py-[10px] rounded-lg border-2 border-[#0f172a] bg-[#0f172a] text-white outline-none focus:ring-2 focus:ring-[#1a6b7a] focus:ring-offset-1"
        >
          Hold bill <span className="opacity-60">F4</span>
        </button>

        <button
          onClick={onSaveWithoutBill}
          className="flex-1 text-sm font-medium py-[10px] rounded-lg bg-[#1a6b7a] text-white outline-none focus:ring-2 focus:ring-[#1a6b7a] focus:ring-offset-1"
        >
          Save only
        </button>

        <button
          onClick={() => {
            console.log('[DEBUG] Save with bill clicked');
            onSaveWithBill();
          }}
          className="flex-1 text-sm font-medium py-[10px] rounded-lg bg-[#1a6b7a] text-white outline-none focus:ring-2 focus:ring-[#1a6b7a] focus:ring-offset-1"
        >
          Save with bill <span className="opacity-70">F9</span>
        </button>
      </div>
    </div>
  );
};

export default PayingPannel;
