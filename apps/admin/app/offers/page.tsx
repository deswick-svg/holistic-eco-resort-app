"use client";

import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";

export default function OffersPage() {
    const [showForm, setShowForm] = useState(false);
    const [offers, setOffers] = useState<
        { name: string; code: string; discount: string; status: string }[]
        >([]);
        const [offerName, setOfferName] = useState("");
        const [couponCode, setCouponCode] = useState("");
        const [discount, setDiscount] = useState("");
        const [status, setStatus] = useState("Active");
        const [editingIndex, setEditingIndex] = useState<number | null>(null);
  return (
    <main className="min-h-screen bg-[#f6f3ea] text-[#173326]">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <section className="flex-1 p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="text-sm text-[#6d786f]">
                Holistic Eco-Resort, Kannur
              </p>
              <h1 className="mt-1 text-3xl font-bold">Offers & Coupons</h1>
            </div>

            <div className="rounded-2xl border border-[#dfe5dd] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Active Offers</h2>
                  <p className="mt-1 text-sm text-[#6d786f]">
                    Manage promotional offers and discount coupons for guests.
                  </p>
                </div>

                <button
                     onClick={() => setShowForm(true)}
                     className="rounded-xl bg-[#2f6a4c] px-4 py-3 text-sm font-medium text-white"
>
                    Add Offer
                </button>
              </div>
                {showForm && (
  <div className="mb-6 rounded-xl border border-[#dfe5dd] bg-[#f8faf7] p-5">
    <h3 className="text-base font-semibold">
  {editingIndex !== null ? "Edit Offer" : "Add New Offer"}
</h3>

    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <input
         type="text"
         placeholder="Offer name"
         value={offerName}
         onChange={(e) => setOfferName(e.target.value)}
         className="rounded-xl border border-[#cfd8d0] bg-white px-4 py-3 text-sm outline-none"
        />

      <input
         type="text"
         placeholder="Coupon code"
         value={couponCode}
         onChange={(e) => setCouponCode(e.target.value)}
         className="rounded-xl border border-[#cfd8d0] bg-white px-4 py-3 text-sm outline-none"
        />

      <input
  type="text"
  placeholder="Discount e.g. 10%"
  value={discount}
  onChange={(e) => setDiscount(e.target.value)}
  className="rounded-xl border border-[#cfd8d0] bg-white px-4 py-3 text-sm outline-none"
/>

      <select
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  className="rounded-xl border border-[#cfd8d0] bg-white px-4 py-3 text-sm outline-none"
>
  <option>Active</option>
  <option>Inactive</option>
</select>
    </div>

    <div className="mt-4 flex gap-3">
      <button
  onClick={() => {
    if (!offerName || !couponCode || !discount) return;

    
      if (editingIndex !== null) {
  const updatedOffers = [...offers];

  updatedOffers[editingIndex] = {
    name: offerName,
    code: couponCode,
    discount,
    status,
  };

  setOffers(updatedOffers);
} else {
  setOffers([
    ...offers,
    {
      name: offerName,
      code: couponCode,
      discount,
      status,
    },
  ]);
}
    

    setOfferName("");
    setCouponCode("");
    setDiscount("");
    setStatus("Active");
    setEditingIndex(null);
    setShowForm(false);
 }}
  className="rounded-xl bg-[#2f6a4c] px-4 py-3 text-sm font-medium text-white"
>
  Save Offer
</button>

      <button
        onClick={() => {
  setShowForm(false);
  setEditingIndex(null);
  setOfferName("");
  setCouponCode("");
  setDiscount("");
  setStatus("Active");
}}
        className="rounded-xl border border-[#cfd8d0] bg-white px-4 py-3 text-sm font-medium"
      >
        Cancel
      </button>
    </div>
  </div>
)}
              <div className="overflow-hidden rounded-xl border border-[#e3e7e2]">
                <div className="grid grid-cols-5 bg-[#f3f5f1] px-4 py-3 text-sm font-semibold">
                  <div>Offer Name</div>
                  <div>Coupon Code</div>
                  <div>Discount</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>

                {offers.length === 0 ? (
  <div className="px-4 py-8 text-center text-sm text-[#6d786f]">
    No offers or coupons to display yet.
  </div>
) : (
  offers.map((offer, index) => (
    <div
      key={index}
      className="grid grid-cols-5 border-t border-[#e3e7e2] px-4 py-4 text-sm"
    >
      <div className="font-medium">{offer.name}</div>
      <div>{offer.code}</div>
      <div>{offer.discount}</div>
      <div>{offer.status}</div>
      <div>
        <button
  onClick={() => {
    setOfferName(offer.name);
    setCouponCode(offer.code);
    setDiscount(offer.discount);
    setStatus(offer.status);
    setEditingIndex(index);
    setShowForm(true);
  }}
  className="rounded-lg border border-[#cfd8d0] px-3 py-2 text-sm"
>
  Manage
</button>
      </div>
    </div>
  ))
)}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}