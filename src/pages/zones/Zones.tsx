import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getZones, createZone, updateZone, toggleZone, deleteZone, type DeliveryZone
} from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiMapPin, FiGlobe, FiInfo, FiRotateCcw, FiTrash
} from "react-icons/fi";
import { toast } from "sonner";
import { MapContainer, TileLayer, Polygon, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Nainital center
const NAINITAL_CENTER: [number, number] = [29.3803, 79.4636];

const emptyZone = (): Partial<DeliveryZone> => ({
  name: "",
  active: true,
  everywhere: true,
  deliveryFee: 30,
  minOrderForFree: 500,
  etaLabel: "20-30 mins",
  taxRate: 0,
  polygon: [],
});

// Click handler inside the map
function PolygonDrawer({
  points,
  onChange,
}: {
  points: [number, number][];
  onChange: (pts: [number, number][]) => void;
}) {
  useMapEvents({
    click(e) {
      onChange([...points, [e.latlng.lat, e.latlng.lng]]);
    },
  });
  return null;
}

export default function Zones() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<DeliveryZone> | null>(null);

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["admin", "zones"],
    queryFn: getZones,
  });

  const saveMut = useMutation({
    mutationFn: (z: Partial<DeliveryZone>) =>
      z.id ? updateZone(z.id, z) : createZone(z),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "zones"] });
      setModalOpen(false);
      toast.success("Saved");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => toggleZone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "zones"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteZone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "zones"] });
      toast.success("Deleted");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Convert polygon storage format [lng, lat] ↔ leaflet [lat, lng]
  const storedToLatLng = (polygon: number[][]): [number, number][] =>
    (polygon ?? []).map(([lng, lat]) => [lat, lng]);

  const latLngToStored = (pts: [number, number][]): number[][] =>
    pts.map(([lat, lng]) => [lng, lat]);

  const mapPoints: [number, number][] = editing?.polygon
    ? storedToLatLng(editing.polygon)
    : [];

  const handleMapClick = useCallback(
    (pts: [number, number][]) => {
      setEditing((prev) => ({ ...prev!, polygon: latLngToStored(pts) }));
    },
    []
  );

  const undoPoint = () => {
    if (!editing?.polygon?.length) return;
    setEditing((prev) => ({ ...prev!, polygon: prev!.polygon!.slice(0, -1) }));
  };

  const clearPolygon = () => {
    setEditing((prev) => ({ ...prev!, polygon: [] }));
  };

  const hasEverywhere = zones.some((z) => z.everywhere && z.active);

  return (
    <div className="min-h-full">
      <PageHeader
        title="Delivery Zones"
        subtitle={`${zones.length} zone${zones.length !== 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => { setEditing(emptyZone()); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" /> Add Zone
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <FiInfo className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-0.5">How zones work</p>
            <p className="text-blue-700">
              An <strong>Everywhere</strong> zone applies to all customers regardless of location.
              A <strong>Polygon</strong> zone uses a geographic boundary drawn on the map — customers
              outside all polygon zones see the "not serviceable" message.
              If no zones exist, all locations are served (open mode).
            </p>
          </div>
        </div>

        {/* Zones list */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : zones.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <FiMapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No delivery zones configured</p>
            <p className="text-slate-400 text-sm mt-1">Currently in open mode — all locations are served</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {zones.map((z: DeliveryZone) => (
              <div
                key={z.id}
                className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${z.active ? "border-slate-200" : "border-slate-100 opacity-60"}`}
              >
                <div className={`px-4 py-3 flex items-center justify-between ${z.active ? "bg-gradient-to-r from-primary-50 to-indigo-50" : "bg-slate-50"}`}>
                  <div className="flex items-center gap-2">
                    {z.everywhere
                      ? <FiGlobe className="w-4 h-4 text-primary-600" />
                      : <FiMapPin className="w-4 h-4 text-indigo-500" />
                    }
                    <span className="font-semibold text-slate-900 text-sm">{z.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${z.everywhere ? "bg-primary-100 text-primary-700" : "bg-indigo-100 text-indigo-700"}`}>
                    {z.everywhere ? "EVERYWHERE" : "POLYGON"}
                  </span>
                </div>

                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Delivery Fee</span>
                    <span className="font-semibold text-slate-900">
                      {z.deliveryFee === 0 ? "FREE" : `₹${z.deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Free above</span>
                    <span className="font-semibold text-slate-900">
                      {z.minOrderForFree === 0 ? "Never free" : `₹${z.minOrderForFree}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">ETA</span>
                    <span className="font-semibold text-slate-900">{z.etaLabel || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Tax Rate</span>
                    <span className="font-semibold text-slate-900">
                      {z.taxRate && z.taxRate > 0 ? `${(z.taxRate * 100).toFixed(0)}%` : "Default"}
                    </span>
                  </div>
                  {!z.everywhere && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Polygon points</span>
                      <span className="font-semibold text-slate-900">{z.polygon?.length ?? 0}</span>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => z.id && toggleMut.mutate(z.id)}
                    className={`p-1.5 rounded-lg transition-colors ${z.active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    title={z.active ? "Deactivate" : "Activate"}
                  >
                    {z.active ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditing({ ...z }); setModalOpen(true); }}
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete zone?")) z.id && deleteMut.mutate(z.id); }}
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${z.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {z.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasEverywhere && (
          <p className="text-xs text-slate-400 text-center">
            An "Everywhere" zone is active — all customers are served regardless of location.
          </p>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={editing?.id ? "Edit Delivery Zone" : "Add Delivery Zone"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size={editing?.everywhere === false ? "lg" : "md"}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700">Cancel</button>
            <button
              onClick={() => editing && saveMut.mutate(editing)}
              disabled={saveMut.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-700"
            >
              {saveMut.isPending ? "Saving…" : "Save Zone"}
            </button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-4 text-sm">
            {/* Zone Name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Zone Name</label>
              <input
                value={editing.name ?? ""}
                onChange={e => setEditing(prev => ({ ...prev!, name: e.target.value }))}
                placeholder="e.g. Nainital City, Mall Road Area"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
              />
            </div>

            {/* ETA */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Estimated Delivery Time</label>
              <input
                value={editing.etaLabel ?? ""}
                onChange={e => setEditing(prev => ({ ...prev!, etaLabel: e.target.value }))}
                placeholder="e.g. 20-30 mins"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
              />
            </div>

            {/* Delivery Fee + Free Above */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={editing.deliveryFee ?? 30}
                  onChange={e => setEditing(prev => ({ ...prev!, deliveryFee: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                />
                <p className="text-[10px] text-slate-400 mt-1">Set 0 for always free</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Free Above (₹)</label>
                <input
                  type="number"
                  value={editing.minOrderForFree ?? 500}
                  onChange={e => setEditing(prev => ({ ...prev!, minOrderForFree: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                />
                <p className="text-[10px] text-slate-400 mt-1">Set 0 to never waive fee</p>
              </div>
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tax Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={editing.taxRate != null ? (editing.taxRate * 100) : 0}
                  onChange={e => setEditing(prev => ({
                    ...prev!,
                    taxRate: Number(e.target.value) / 100,
                  }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Set 0 to use the global default tax rate (configured in server settings)
              </p>
            </div>

            {/* Zone Type */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Zone Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(prev => ({ ...prev!, everywhere: true }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors ${editing.everywhere ? "border-primary-600 bg-primary-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <FiGlobe className={`w-5 h-5 ${editing.everywhere ? "text-primary-600" : "text-slate-400"}`} />
                  <span className={`text-xs font-semibold ${editing.everywhere ? "text-primary-700" : "text-slate-500"}`}>Everywhere</span>
                  <span className="text-[10px] text-slate-400 text-center leading-tight">Applies to all customers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(prev => ({ ...prev!, everywhere: false }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors ${!editing.everywhere ? "border-primary-600 bg-primary-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <FiMapPin className={`w-5 h-5 ${!editing.everywhere ? "text-primary-600" : "text-slate-400"}`} />
                  <span className={`text-xs font-semibold ${!editing.everywhere ? "text-primary-700" : "text-slate-500"}`}>Polygon Area</span>
                  <span className="text-[10px] text-slate-400 text-center leading-tight">Draw on map</span>
                </button>
              </div>
            </div>

            {/* Map polygon drawer (shown only for polygon type) */}
            {!editing.everywhere && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-600">
                    Draw Zone Boundary
                    <span className="ml-2 text-[10px] text-slate-400 font-normal">
                      Click on the map to add points ({mapPoints.length} point{mapPoints.length !== 1 ? "s" : ""})
                    </span>
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={undoPoint}
                      disabled={!mapPoints.length}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiRotateCcw className="w-3 h-3" /> Undo
                    </button>
                    <button
                      type="button"
                      onClick={clearPolygon}
                      disabled={!mapPoints.length}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-red-50 text-red-600 rounded-md hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiTrash className="w-3 h-3" /> Clear
                    </button>
                  </div>
                </div>

                {mapPoints.length < 3 && mapPoints.length > 0 && (
                  <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 mb-2">
                    Need at least 3 points to form a polygon ({3 - mapPoints.length} more needed)
                  </p>
                )}

                <div className="rounded-xl overflow-hidden border border-slate-300 cursor-crosshair" style={{ height: 320 }}>
                  <MapContainer
                    center={mapPoints.length > 0 ? mapPoints[0] : NAINITAL_CENTER}
                    zoom={14}
                    style={{ height: "100%", width: "100%" }}
                    key={editing.id ?? "new"}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapPoints.length >= 3 && (
                      <Polygon
                        positions={mapPoints}
                        pathOptions={{ color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.2, weight: 2 }}
                      />
                    )}
                    <PolygonDrawer points={mapPoints} onChange={handleMapClick} />
                  </MapContainer>
                </div>

                <p className="text-[10px] text-slate-400 mt-1">
                  Click on the map to place boundary points. The polygon closes automatically.
                </p>
              </div>
            )}

            {/* Active toggle */}
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="zoneActive"
                checked={editing.active ?? true}
                onChange={e => setEditing(prev => ({ ...prev!, active: e.target.checked }))}
                className="w-4 h-4 accent-primary-600"
              />
              <label htmlFor="zoneActive" className="text-sm text-slate-700">Active (customers will be matched to this zone)</label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
