// Header.jsx
// Pure UI layout only. All state/handlers are passed in as props from usePosHooks via mainScreen.jsx.
// No logic lives here.

import { FiRotateCcw, FiClock as FiHeldBills, FiXCircle, FiArrowLeft, } from "react-icons/fi";
import { BsCalculator } from "react-icons/bs";
import { useNavigate } from 'react-router-dom'

const Header = ({
  storeName,
  currentDateTime,
  onSaleReturnClick,
  onHeldBillsClick,
  heldBillsCount,
  onCalculatorClick,
  onClosePosClick,
}) => {
  const parsedDateTime = new Date(currentDateTime);
  const navigate = useNavigate()
  const formattedDateTime = isNaN(parsedDateTime.getTime())
    ? ""
    : parsedDateTime.toLocaleString("en-LK", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const onBackClick = () => {
    navigate('/dashboard')
  }

  return (
    <div className="flex items-center justify-between bg-[#1a6b7a] h-[80px] px-4 py-2.5 rounded-t-xl">
      {/* Left: store identity + live clock */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-[#2699aa] flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">AD</span>
        </div>
        <span className="text-white text-md font-medium">
          {storeName}
        </span>
        <span className="text-slate-200 text-md">
          {formattedDateTime}
        </span>
      </div>

      {/* Right: quick action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSaleReturnClick}
          className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-md border border-white text-slate-700 bg-white hover:bg-white hover:text-[#0f172a]"
        >
          <FiRotateCcw size={14} />
          Sale return
        </button>

        <button
          onClick={onHeldBillsClick}
          className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-md border border-white text-slate-700 bg-white hover:bg-white hover:text-[#0f172a]"
        >
          <FiHeldBills size={14} />
          Held bills {heldBillsCount ? `(${heldBillsCount})` : ""}
        </button>

        <button
          onClick={onCalculatorClick}
          className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-md border border-white text-slate-700 bg-white hover:bg-white hover:text-[#0f172a]"
        >
          <BsCalculator size={14} />
          Cal
        </button>
        <button
          onClick={onBackClick}
          className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-md border border-white text-slate-700 bg-white hover:bg-white hover:text-[#0f172a]"
        >
          <FiArrowLeft size={14} />
          Back
        </button>

        <button
          onClick={onClosePosClick}
          className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-md bg-red-500 text-white font-medium hover:bg-red-600"
        >
          <FiXCircle size={14} />
          Close POS
        </button>
      </div>
    </div>
  );
};

export default Header;
