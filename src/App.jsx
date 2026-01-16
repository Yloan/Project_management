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

// Client Supabase simple
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
    update: (updates) => ({
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
    delete: () => ({
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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "open",
    assignee: "",
  });

  // Charger les données
  useEffect(() => {
    loadData();
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
      console.error("Erreur de chargement:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    const res = await supabase
      .from(activeTab)
      .update({ status: newStatus })
      .eq("id", item.id);

    console.log(res);

    await loadData();
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

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">LAODING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b0f] p-6 text-emerald-200">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#0a141a] rounded-lg shadow-lg shadow-emerald-900/30 p-6 mb-6 border border-emerald-800">
          <h1 className="text-3xl font-extrabold text-emerald-400 tracking-wider mb-2">
            PROJECT TRACKER
          </h1>
          <p className="text-emerald-300/70">
            Tactical bug & task command panel
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-[#0a141a] rounded-lg shadow-sm mb-6 border border-emerald-800">
          <div className="flex border-b border-emerald-800">
            <button
              onClick={() => setActiveTab("bugs")}
              className={`flex-1 px-6 py-4 font-bold tracking-wide transition-colors ${
                activeTab === "bugs"
                  ? "text-red-400 border-b-2 border-red-500 bg-red-900/20"
                  : "text-emerald-300 hover:text-emerald-400"
              }`}
            >
              <AlertCircle className="inline mr-2" size={20} />
              BUGS ({bugs.length})
            </button>
            <button
              onClick={() => setActiveTab("todos")}
              className={`flex-1 px-6 py-4 font-bold tracking-wide transition-colors ${
                activeTab === "todos"
                  ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-900/20"
                  : "text-emerald-300 hover:text-emerald-400"
              }`}
            >
              <CheckCircle2 className="inline mr-2" size={20} />
              TODOS ({todos.length})
            </button>
          </div>
        </div>

        {/* Bouton Ajouter */}
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 bg-emerald-600 text-black px-6 py-3 rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2 font-bold tracking-wide shadow-lg shadow-emerald-900/40"
        >
          <Plus size={20} />
          DEPLOY
        </button>

        {/* Liste des items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-[#0a141a] rounded-lg shadow-sm p-4 border border-emerald-800 ${
                item.status === "closed" ? "opacity-60" : ""
              }`}
            >
        {/* Formulaire */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingItem ? "Modifier" : "Ajouter"}{" "}
                  {activeTab === "bugs" ? "un bug" : "une tâche"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigné à
                  </label>
                  <input
                    type="text"
                    value={formData.assignee}
                    onChange={(e) =>
                      setFormData({ ...formData, assignee: e.target.value })
                    }
                    placeholder="Nom du membre"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingItem ? "Modifier" : "Ajouter"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Liste des items */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Aucun {activeTab === "bugs" ? "bug" : "todo"} pour le moment
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm p-4 transition-all ${
                  item.status === "closed" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => toggleStatus(item)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          item.status === "closed"
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 hover:border-green-500"
                        }`}
                      >
                        {item.status === "closed" && (
                          <CheckCircle2 size={16} className="text-white" />
                        )}
                      </button>
                      <h3
                        className={`text-lg font-semibold ${
                          item.status === "closed"
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {item.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}
                      >
                        {item.priority === "low"
                          ? "Basse"
                          : item.priority === "medium"
                            ? "Moyenne"
                            : "Haute"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-gray-600 ml-9 mb-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 ml-9 text-sm text-gray-500">
                      {item.assignee && <span>👤 {item.assignee}</span>}
                      <span>
                        {new Date(item.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
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
