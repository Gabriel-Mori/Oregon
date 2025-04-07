import { ReactNode } from "react";

interface PercentageItemProps {
  icon: ReactNode;
  title: string;
  value: number;
}

const PercentageItem = ({ icon, title, value }: PercentageItemProps) => {
  let valeuPercentage = value;
  if (Number.isNaN(value) || value === undefined || value === null) {
    valeuPercentage = 0;
  }

  return (
    <div className="flex items-center justify-between">
      {/* Icone */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-white bg-opacity-[3%] p-2">{icon}</div>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
      <p className="text-sm font-bold">{valeuPercentage}%</p>
    </div>
  );
};

export default PercentageItem;
