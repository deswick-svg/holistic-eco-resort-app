import Link from "next/link";
import AdminSidebar from "../components/AdminSidebar";
export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f3ea] text-[#173326]">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <section className="flex-1 p-8">
          <div className="mb-8">
            <p className="text-sm text-[#6d786f]">Holistic Eco-Resort, Kannur</p>
            <h2 className="mt-1 text-3xl font-bold">Dashboard</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Today's Bookings", "0"],
              ["Check-ins Today", "0"],
              ["Check-outs Today", "0"],
              ["Open Enquiries", "0"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#dfe5dd] bg-white p-6 shadow-sm"
              >
                <p className="text-sm text-[#6d786f]">{label}</p>
                <p className="mt-3 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#dfe5dd] bg-white p-6">
              <h3 className="text-lg font-semibold">Recent Bookings</h3>
              <p className="mt-2 text-sm text-[#6d786f]">
                Live Simplotel bookings will appear here once the API connection is enabled.
              </p>
            </div>

            <div className="rounded-2xl border border-[#dfe5dd] bg-white p-6">
              <h3 className="text-lg font-semibold">Quick Actions</h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button className="rounded-xl bg-[#2f6a4c] px-4 py-3 text-sm font-medium text-white">
                  Add Offer
                </button>

                <button className="rounded-xl border border-[#cfd8d0] px-4 py-3 text-sm font-medium">
                  Update Gallery
                </button>

                <button className="rounded-xl border border-[#cfd8d0] px-4 py-3 text-sm font-medium">
                  View Guests
                </button>

                <button className="rounded-xl border border-[#cfd8d0] px-4 py-3 text-sm font-medium">
                  Manage Rooms
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
