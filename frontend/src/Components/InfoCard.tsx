// frontend/components/InfoCard.tsx

import React from "react";
import {
  cardBase,
  cardLayout,
  cardSizes,
  cardIcon,
  cardTitle,
  cardText,
} from "../utils/cardStyles";

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  title,
  text,
  size = "md",
  onClick,
  disabled = false,
}) => {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        ${cardBase}
        ${cardLayout}
        ${cardSizes[size]}
        ${onClick && !disabled ? "cursor-pointer hover:ring-emerald-300" : ""}
        ${disabled ? "opacity-60 pointer-events-none" : ""}
      `}
    >
      <div className={cardIcon}>{icon}</div>

      <h3 className={cardTitle}>{title}</h3>

      <p className={cardText}>{text}</p>
    </div>
  );
};

export default InfoCard;
