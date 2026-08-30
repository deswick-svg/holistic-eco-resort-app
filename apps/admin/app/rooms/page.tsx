import AdminSidebar from "../../components/AdminSidebar";

const rooms = [
  ["Tent Stay", "103938"],
  ["Tree House", "103939"],
  ["River Rock Villa", "103940"],
  ["Forest View Room", "103941"],
  ["Caravan Stay", "103942"],
  ["Tower Suite", "103943"],
  ["Family Suite", "103944"],
  ["Tent Triple", "104406"],
  ["Mid House", "104407"],
  ["Honeymoon Suite", "104408"],
  ["Kerala Traditional Villa", "104610"],
  ["Glass Dome", "119794"],
];

export default function RoomsPage() {
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
              <h1 className="mt-1 text-3xl font-bold">Rooms & Stays</h1>
            </div>

            <div className="rounded-2xl border border-[#dfe5dd] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Room Types</h2>
                  <p className="mt-1 text-sm text-[#6d786f]">
                    Simplotel room IDs for Hotel ID 7849.
                  </p>
                </div>

                <button className="rounded-xl bg-[#2f6a4c] px-4 py-3 text-sm font-medium text-white">
                  Add Room
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#e3e7e2]">
                <div className="grid grid-cols-3 bg-[#f3f5f1] px-4 py-3 text-sm font-semibold">
                  <div>Room Name</div>
                  <div>Room ID</div>
                  <div>Actions</div>
                </div>

                {rooms.map(([name, id]) => (
                  <div
                    key={id}
                    className="grid grid-cols-3 border-t border-[#e3e7e2] px-4 py-4 text-sm"
                  >
                    <div className="font-medium">{name}</div>
                    <div className="text-[#6d786f]">{id}</div>
                    <div>
                      <button className="rounded-lg border border-[#cfd8d0] px-3 py-2 text-sm">
                        Manage
                      </button>
                    </div>
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