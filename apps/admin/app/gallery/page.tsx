import AdminSidebar from "../../components/AdminSidebar";

export default function GalleryPage() {
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
              <h1 className="mt-1 text-3xl font-bold">Gallery</h1>
            </div>

            <div className="rounded-2xl border border-[#dfe5dd] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Resort Images</h2>
                  <p className="mt-1 text-sm text-[#6d786f]">
                    Manage photos displayed in the guest mobile app.
                  </p>
                </div>

                <button className="rounded-xl bg-[#2f6a4c] px-4 py-3 text-sm font-medium text-white">
                  Upload Image
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="flex h-44 items-center justify-center rounded-xl border border-dashed border-[#cfd8d0] bg-[#f8faf7] text-sm text-[#6d786f]"
                  >
                    Image slot {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}