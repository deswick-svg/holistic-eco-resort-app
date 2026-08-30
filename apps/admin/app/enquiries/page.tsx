import AdminSidebar from "../../components/AdminSidebar";

export default function EnquiriesPage() {
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
              <h1 className="mt-1 text-3xl font-bold">Enquiries</h1>
            </div>

            <div className="rounded-2xl border border-[#dfe5dd] bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Guest Enquiries</h2>
                <p className="mt-1 text-sm text-[#6d786f]">
                  Messages and enquiries from guests will appear here.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#e3e7e2]">
                <div className="grid grid-cols-6 bg-[#f3f5f1] px-4 py-3 text-sm font-semibold">
                  <div>Name</div>
                  <div>Phone</div>
                  <div>Email</div>
                  <div>Subject</div>
                  <div>Date</div>
                  <div>Status</div>
                </div>

                <div className="px-4 py-8 text-center text-sm text-[#6d786f]">
                  No enquiries to display yet.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}