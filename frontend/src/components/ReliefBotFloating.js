import React, { useState } from "react";
import "./ReliefBotFloating.css";
import ReliefBot from "./ReliefBot";
import { MessageCircle, X } from "lucide-react";

export default function ReliefBotFloating() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`reliefbot-floating ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      {/* Conditional Chat Window Overlay */}
      {isOpen && (
        <div className="reliefbot-modal-container">
          <ReliefBot isWidget={true} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}