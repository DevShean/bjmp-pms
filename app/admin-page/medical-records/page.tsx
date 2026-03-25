import AdminSidebarLayout from "../components/AdminSidebarLayout";
import {
  AlertCircle,
  CheckCircle2,
  BriefcaseMedical,
  Columns,
  AlertTriangle,
  Calendar,
  IdCard,
  ChevronDown,
} from "lucide-react";

export default function MedicalRecordsPage() {
  return (
    <AdminSidebarLayout>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm md:flex-row md:items-center md:justify-between sm:px-8">
          <div>
            <h1 className="font-lexend text-2xl font-semibold text-slate-800 flex items-center gap-3 sm:text-3xl">
              Medical Records
              <BriefcaseMedical size={32} className="text-teal-600 shrink-0" />
            </h1>
            <p className="mt-1 text-sm text-slate-600">Track inmate health checkups, diagnoses, and medical requirements</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row items-center gap-4">
          <label className="text-sm font-medium text-slate-600 shrink-0">
            Filter by Assigned Staff:
          </label>
          <div className="relative w-full sm:w-auto">
            <select className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 block w-full sm:w-48 p-2.5 pr-8">
              <option>All Staff</option>
              <option>Danna Villanueva</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <button className="bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg text-sm px-6 py-2.5 transition-colors w-full sm:w-auto">
            Filter Results
          </button>
        </div>

        {/* Records Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {/* Record Card */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(15,118,110,0.1)] border border-slate-100 p-6 relative flex flex-col gap-4 max-w-md">
            
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold font-lexend text-slate-800">
                  Anthony Lopez
                </h2>
                <div className="text-xs text-slate-500 mt-1 space-y-1">
                  <p>Record Date: March 21, 2026</p>
                  <p>Assigned Staff: Danna Villanueva</p>
                </div>
              </div>
              <span className="bg-teal-100 text-teal-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                Routine Checkup
              </span>
            </div>

            <div className="space-y-3 mt-1 text-sm text-slate-600">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                <p>
                  <strong className="text-slate-800 font-bold">Diagnosis:</strong> dsdasd
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                <p>
                  <strong className="text-slate-800 font-bold">Treatment:</strong> dsadasd
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <BriefcaseMedical className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                <p>
                  <strong className="text-slate-800 font-bold">Medication:</strong> dsada
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-50 h-px my-1" />

            {/* Vital Signs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Columns className="w-5 h-5 text-teal-500" strokeWidth={2.5} />
                <h3 className="font-bold text-slate-800">Vital Signs</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-teal-50/70 border border-teal-50/50 rounded-lg p-3">
                  <span className="text-teal-600 text-[13px] font-medium block">BP: ddsad</span>
                </div>
                <div className="bg-red-50 border border-red-50 flex items-center rounded-lg p-3">
                  <span className="text-red-400 text-[13px] font-medium block">Temp: 0.8°C</span>
                </div>
                <div className="bg-green-50 border border-green-50 rounded-lg p-3">
                  <span className="text-green-500 text-[13px] font-medium block">Pulse: 3 bpm</span>
                </div>
                <div className="bg-purple-50 border border-purple-50 rounded-lg p-3">
                  <span className="text-purple-400 text-[13px] font-medium block">Resp Rate: 3 bpm</span>
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-50 h-px my-1" />

            <div className="space-y-3 text-sm text-slate-600">
               <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                <p>
                  <strong className="text-slate-800 font-bold">Condition:</strong> dsadasd
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                <p>
                  <strong className="text-slate-800 font-bold">Allergies:</strong> dsadasd
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                <p>
                  <strong className="text-slate-800 font-bold">Next Checkup:</strong> 2026-03-21
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <IdCard className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                <p>
                  <strong className="text-slate-800 font-bold">Referred To:</strong> dsadasdsa
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminSidebarLayout>
  );
}
