// src/components/BackButton.tsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center text-sm text-gray-700 hover:text-black mb-4"
    >
      <ArrowLeft className="w-5 h-5 mr-1" />
      Retour
    </button>
  );
};

export default BackButton;
