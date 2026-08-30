import AdminSidebar from "../../components/AdminSidebar";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ea] text-[#173326]">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <section className="flex-1 p-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <p className="text-sm text-[#6d786f]">
                Holistic Eco-Resort, Kannur
              </p>
              <h1 className="mt-1 text-3xl font-bold">Settings</h1>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-[#dfe5dd] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Property Information</h2>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Property Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Holistic Eco-Resort, Kannur"
                      className="w-full rounded-xl border border-[#cfd8d0] px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Simplotel Hotel ID
                    </label>
                    <input
                      type="text"
                      defaultValue="7849"
                      readOnly
                      className="w-full rounded-xl border border-[#cfd8d0] bg-[#f5f6f4] px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      defaultValue="booking@holisticstay.in"
                      className="w-full rounded-xl border border-[#cfd8d0] px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Currency
                    </label>
                    <input
                      type="text"
                      defaultValue="INR"
                      readOnly
                      className="w-full rounded-xl border border-[#cfd8d0] bg-[#f5f6f4] px-4 py-3 text-sm"
                    />
                  </div>
                </div>

                <button className="mt-6 rounded-xl bg-[#2f6a4c] px-5 py-3 text-sm font-medium text-white">
                  Save Settings
                </button>
              </div>

              <div className="rounded-2xl border border-[#dfe5dd] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Integrations</h2>

                <div className="mt-5 flex items-center justify-between rounded-xl border border-[#e3e7e2] p-4">
                  <div>
                    <p className="font-medium">Simplotel</p>
                    <p className="mt-1 text-sm text-[#6d786f]">
                      Booking API connection for Hotel ID 7849.
                    </p>
                  </div>

                  <span className="rounded-full bg-[#e8f3ec] px-3 py-1 text-sm font-medium text-[#2f6a4c]">
                    API reachable
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}