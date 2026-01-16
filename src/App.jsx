import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  X,
} from "lucide-react";

// Configuration Supabase
const SUPABASE_URL = "https://wsjtuvhqhydjvveypmgq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzanR1dmhxaHlkanZ2ZXlwbWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NzQ2MjUsImV4cCI6MjA4NDE1MDYyNX0.XDQjtSnI8uAxtswVk5YcKmPcTwj5ijirT_4voBrJDiA";

const supabase = {
  from: (table) => ({
    select: async (columns = "*") => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=${columns}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        },
      );
      const data = await res.json();
      return { data, error: res.ok ? null : data };
    },
    insert: async (record) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(record),
      });
      const data = await res.json();
      return { data, error: res.ok ? null : data };
    },
    update: async (updates) => ({
      eq: async (column, value) => {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`,
          {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify(updates),
          },
        );
        const data = await res.json();
        return { data, error: res.ok ? null : data };
      },
    }),
    delete: async () => ({
      eq: async (column, value) => {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`,
          {
            method: "DELETE",
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );
        return { error: res.ok ? null : await res.json() };
      },
    }),
  }),
};

export default function ProjectTracker() {
  const [activeTab, setActiveTab] = useState("bugs");
  const [bugs, setBugs] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "open",
    assignee: "",
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bugsRes, todosRes] = await Promise.all([
        supabase.from("bugs").select("*"),
        supabase.from("todos").select("*"),
      ]);

      if (bugsRes.data) setBugs(bugsRes.data.sort((a, b) => b.id - a.id));
      if (todosRes.data) setTodos(todosRes.data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Erreur:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("Le titre est requis");
      return;
    }

    const table = activeTab;
    const record = { ...formData, created_at: new Date().toISOString() };

    try {
      if (editingItem) {
        await supabase.from(table).update(formData).eq("id", editingItem.id);
      } else {
        await supabase.from(table).insert(record);
      }
      await loadData();
      resetForm();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cet élément ?")) return;
    try {
      await supabase.from(activeTab).delete().eq("id", id);
      await loadData();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      priority: item.priority,
      status: item.status,
      assignee: item.assignee || "",
    });
    setShowForm(true);
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === "open" ? "closed" : "open";
    try {
      await supabase
        .from(activeTab)
        .update({ status: newStatus })
        .eq("id", item.id);
      await loadData();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      status: "open",
      assignee: "",
    });
  };

  const items = activeTab === "bugs" ? bugs : todos;
  const filteredItems = items.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-emerald-100 text-emerald-700 border-emerald-200",
      medium: "bg-amber-100 text-amber-700 border-amber-200",
      high: "bg-rose-100 text-rose-700 border-rose-200",
    };
    return colors[priority] || colors.medium;
  };

  const getStats = () => {
    const open = items.filter((i) => i.status === "open").length;
    const closed = items.filter((i) => i.status === "closed").length;
    return { open, closed, total: items.length };
  };

  const stats = getStats();

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Project Tracker
              </h1>
              <p className="text-slate-600">
                Gestion collaborative de bugs et tâches
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <span className="text-blue-600 font-semibold">
                  {stats.open}
                </span>
                <span className="text-blue-700 ml-1">en cours</span>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <span className="text-green-600 font-semibold">
                  {stats.closed}
                </span>
                <span className="text-green-700 ml-1">terminés</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 border border-slate-200 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab("bugs")}
              className={`flex-1 px-6 py-5 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "bugs"
                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <AlertCircle size={22} />
              <span>Bugs</span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === "bugs" ? "bg-white/20" : "bg-slate-200"
                }`}
              >
                {bugs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("todos")}
              className={`flex-1 px-6 py-5 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "todos"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CheckCircle2 size={22} />
              <span>Todos</span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === "todos" ? "bg-white/20" : "bg-slate-200"
                }`}
              >
                {todos.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-violet-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Ajouter {activeTab === "bugs" ? "un bug" : "une tâche"}
          </button>

          <div className="flex gap-2 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === "all"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterStatus("open")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === "open"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              En cours
            </button>
            <button
              onClick={() => setFilterStatus("closed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === "closed"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Terminés
            </button>
          </div>
        </div>

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingItem ? "Modifier" : "Ajouter"}{" "}
                  {activeTab === "bugs" ? "un bug" : "une tâche"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Titre descriptif..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Détails supplémentaires..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Priorité
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="low">🟢 Basse</option>
                      <option value="medium">🟡 Moyenne</option>
                      <option value="high">🔴 Haute</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Assigné à
                    </label>
                    <input
                      type="text"
                      value={formData.assignee}
                      onChange={(e) =>
                        setFormData({ ...formData, assignee: e.target.value })
                      }
                      placeholder="Nom"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-violet-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                  >
                    {editingItem ? "Modifier" : "Ajouter"}
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl hover:bg-slate-200 transition-all font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
              <div className="text-slate-400 text-6xl mb-4">📋</div>
              <p className="text-slate-500 text-lg">
                {filterStatus === "all"
                  ? `Aucun ${activeTab === "bugs" ? "bug" : "todo"} pour le moment`
                  : `Aucun élément ${filterStatus === "open" ? "en cours" : "terminé"}`}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                  item.status === "closed"
                    ? "border-green-200 bg-green-50/30"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleStatus(item)}
                      className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                        item.status === "closed"
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 shadow-lg"
                          : "border-slate-300 hover:border-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      {item.status === "closed" && (
                        <CheckCircle2
                          size={18}
                          className="text-white"
                          strokeWidth={3}
                        />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3
                          className={`text-lg font-semibold ${
                            item.status === "closed"
                              ? "line-through text-slate-400"
                              : "text-slate-900"
                          }`}
                        >
                          {item.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold border ${getPriorityColor(item.priority)}`}
                        >
                          {item.priority === "low"
                            ? "🟢 BASSE"
                            : item.priority === "medium"
                              ? "🟡 MOYENNE"
                              : "🔴 HAUTE"}
                        </span>
                      </div>

                      {item.description && (
                        <p
                          className={`mb-3 ${item.status === "closed" ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {item.assignee && (
                          <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                            <User size={14} />
                            <span className="font-medium">{item.assignee}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={14} />
                          <span>
                            {new Date(item.created_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
