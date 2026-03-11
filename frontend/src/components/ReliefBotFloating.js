import React from "react";
import { useNavigate } from "react-router-dom";
import "./ReliefBotFloating.css";

export default function ReliefBotFloating() {

  const navigate = useNavigate();

  return (
    <button
      className="reliefbot-floating"
      onClick={() => navigate("/relief-bot")}
    >
      🤖
    </button>
  );
}