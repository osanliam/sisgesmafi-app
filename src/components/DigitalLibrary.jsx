import React, { useState, useContext } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import { Search, FolderLock, Plus, FileText, Download, Pencil, Trash2 } from 'lucide-react';

function DigitalLibrary() {
  const { library, addLibraryItem, updateLibraryItem, deleteLibraryItem } = useContext(DatabaseContext);

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Matemáticas');
  const [format, setFormat] = useState('PDF');

  const [editingItem, setEditingItem] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !author) return alert('Por favor ingrese el título y autor.');

    addLibraryItem({
      title,
      author,
      category,
      format
    });

    setTitle('');
    setAuthor('');
    setShowAddForm(false);
    alert('Recurso digital indexado con éxito.');
  };

  // Filter items
  const filteredItems = library.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Matemáticas', 'Literatura', 'Ciencias', 'Otros'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Biblioteca Digital</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Repositorio estructurado de guías didácticas, lecturas y recursos educativos.</p>
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-neuro-primary flex items-center gap-2 text-xs self-start"
        >
          <Plus className="h-4 w-4" />
          Añadir Recurso
        </button>
      </div>

      {/* Add Document Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <h4 className="font-bold border-b border-slate-100 pb-3 dark:border-slate-800">Añadir Recurso a la Biblioteca</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Título del Recurso</label>
              <input 
                type="text" required placeholder="e.g. Álgebra Lineal Práctico..." value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Autor / Institución</label>
              <input 
                type="text" required placeholder="e.g. Baldor, Minedu..." value={author} onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Categoría</label>
              <select 
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Formato</label>
              <select 
                value={format} onChange={(e) => setFormat(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 font-bold"
              >
                <option value="PDF">PDF (Documento)</option>
                <option value="DOCX">DOCX (Procesador)</option>
                <option value="XLSX">XLSX (Hojas de cálculo)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-neuro-secondary text-xs">Cancelar</button>
            <button type="submit" className="btn-neuro-primary text-xs">Indexar Recurso</button>
          </div>
        </form>
      )}

      {/* Filter and Directory Layout */}
      <div className="glass-card p-6 space-y-6">
        
        {/* Filters Panel */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar libros o guías..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedCategory === '' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Resource List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <p className="text-slate-400 text-center py-8 col-span-2">No se encontraron archivos en la biblioteca digital.</p>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center justify-between hover:scale-[1.005] transition-transform">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{item.title}</h5>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Autor: {item.author}</p>
                    <div className="flex gap-2 text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mt-1.5">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{item.format}</span>
                      <span>•</span>
                      <span>Tamaño: {item.fileSize}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <button 
                    onClick={() => setEditingItem(item)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition"
                    title="Editar Recurso"
                  >
                    <Pencil className="h-4.5 w-4.5" />
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (window.confirm(`¿Está seguro de eliminar el recurso digital "${item.title}"?`)) {
                        deleteLibraryItem(item.id);
                      }
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition"
                    title="Eliminar Recurso"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>

                  <a 
                    href={item.downloadUrl}
                    onClick={(e) => { e.preventDefault(); alert(`Descargando archivo [${item.title}] en formato ${item.format}...`); }}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition"
                    title="Descargar Recurso"
                  >
                    <Download className="h-4.5 w-4.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Edit Library Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="glass-card p-6 max-w-md w-full space-y-4 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">Modificar Recurso Digital</h4>
              <button 
                type="button" 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editingItem.title || !editingItem.author) return alert('Por favor ingrese título y autor.');
              updateLibraryItem(editingItem.id, editingItem);
              setEditingItem(null);
              alert('Recurso digital actualizado con éxito.');
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Título del Recurso</label>
                <input 
                  type="text" required value={editingItem.title || ''} 
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Autor / Institución</label>
                <input 
                  type="text" required value={editingItem.author || ''} 
                  onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Categoría</label>
                <select 
                  value={editingItem.category || 'Matemáticas'} 
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 font-semibold"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Formato</label>
                <select 
                  value={editingItem.format || 'PDF'} 
                  onChange={(e) => setEditingItem({ ...editingItem, format: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 font-semibold"
                >
                  <option value="PDF">PDF (Documento)</option>
                  <option value="DOCX">DOCX (Procesador)</option>
                  <option value="XLSX">XLSX (Hojas de cálculo)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)} 
                  className="btn-neuro-secondary text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-neuro-primary text-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default DigitalLibrary;
