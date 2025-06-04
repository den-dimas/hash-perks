import Link from "next/link";
import { Building, Tag, DollarSign, ArrowRight } from "lucide-react";

export function BusinessCard({ business }) {
  return (
    <div className="card-modern flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center">
          <Building className="h-6 w-6 mr-2 text-polka-pink" />
          {business.name}
        </h3>
        <p className="text-slate-600 text-sm mb-1 flex items-center">
          <Tag className="h-4 w-4 mr-1.5 text-slate-400" />
          Symbol: {business.symbol}
        </p>
        <p className="text-slate-600 text-sm mb-3 flex items-center break-all">
          <DollarSign className="h-4 w-4 mr-1.5 text-slate-400" />
          Contract: {business.address}
        </p>
      </div>
      <div className="mt-4">
        <Link href={`/business/${business.id}`} className="btn-secondary-light w-full">
          View Details <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
