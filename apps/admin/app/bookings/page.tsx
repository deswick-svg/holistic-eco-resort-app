import Link from "next/link";
import AdminSidebar from "../../components/AdminSidebar";

export default function BookingsPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ea] text-[#173326]">
  <div className="flex min-h-screen">
   <AdminSidebar />

    <section className="flex-1 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#6d786f]">Holistic Eco-Resort, Kannur</p>
            <h1 className="mt-1 text-3xl font-bold">Bookings</h1>
          </div>

          <Link
            href="/"
            className="rounded-lg border border-[#cfd8d0] bg-white px-4 py-2 text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-[#dfe5dd] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">All Bookings</h2>

          <p className="mt-2 text-sm text-[#6d786f]">
            Live Simplotel bookings will appear here once the API connection is enabled.
          </p>

          <div className="mt-6 overflow-hidden rounded-xl border border-[#e3e7e2]">
            <div className="grid grid-cols-6 bg-[#f3f5f1] px-4 py-3 text-sm font-semibold">
              <div>Booking ID</div>
              <div>Guest</div>
              <div>Room</div>
              <div>Check-in</div>
              <div>Check-out</div>
              <div>Status</div>
            </div>

            <div className="px-4 py-8 text-center text-sm text-[#6d786f]">
              No bookings to display yet.
            </div>
          </div>
        </div>
      </div>
        </section>
  </div>
    </main>
  );
}