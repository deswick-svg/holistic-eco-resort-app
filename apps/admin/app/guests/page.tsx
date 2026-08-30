import AdminSidebar from "../../components/AdminSidebar";

export default function GuestsPage() {
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
              <h1 className="mt-1 text-3xl font-bold">Guests</h1>
            </div>

            <div className="rounded-2xl border border-[#dfe5dd] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Guest Directory</h2>

              <p className="mt-2 text-sm text-[#6d786f]">
                Guest details from reservations will appear here.
              </p>

              <div className="mt-6 overflow-hidden rounded-xl border border-[#e3e7e2]">
                <div className="grid grid-cols-5 bg-[#f3f5f1] px-4 py-3 text-sm font-semibold">
                  <div>Guest Name</div>
                  <div>Phone</div>
                  <div>Email</div>
                  <div>Last Stay</div>
                  <div>Bookings</div>
                </div>

                <div className="px-4 py-8 text-center text-sm text-[#6d786f]">
                  No guest records to display yet.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}