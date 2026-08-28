import { Button } from "@/components/ui/button";
import { formatAmount } from "@/utils";

interface FacilityCardProps {
  title: string;
  imgUrl: string;
  description: string;
  facilityType: string;
  accessType: string;
  /** Fees arrive from the API as decimal strings. */
  price: number | string;
  onClick?: () => void;
}

export default function FacilityCard({
  title,
  imgUrl,
  description,
  facilityType,
  accessType,
  price,
  onClick,
}: FacilityCardProps) {
  return (
    <div className="space-y-1.5 bg-[#F5F5F5] p-3 rounded-3xl shadow">
      <img
        src={imgUrl}
        alt={title}
        width={400}
        height={250}
        className="w-full h-[140px] object-cover rounded-xl"
      />
      <h3 className="font-semibold text-base text-primary-text">{title}</h3>
      <p>{description}</p>

      <div className="flex items-center justify-between w-full">
        <h2 className="font-bold mb-1 text-primary-text">Facility Type</h2>
        <p>{facilityType}</p>
      </div>
      <div className="flex items-center justify-between w-full">
        <h2 className="font-bold mb-1 text-primary-text capitalize">Access</h2>
        <p className="capitalize">{accessType}</p>
      </div>
      <div className="flex items-center justify-between w-full">
        <h2 className="font-bold mb-1 text-primary-text">Price</h2>
        <p>{formatAmount(price)}</p>
      </div>
      {onClick && (
        <div className="w-full flex items-center justify-center">
          <Button
            size={"lg"}
            className="w-[187px] rounded-3xl py-5"
            onClick={onClick}
          >
            Book
          </Button>
        </div>
      )}
    </div>
  );
}
