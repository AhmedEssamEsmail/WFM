import { useState } from 'react';
import { useSkills } from '../../hooks/useSkills';
import type { Skill } from '../../types';

export default function SkillsManager() {
  const { skills, isLoading, createSkill, updateSkill, deleteSkill } = useSkills();
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true,
  });
  const [showAddSkill, setShowAddSkill] = useState(false);

  async function saveSkill() {
    if (!editingSkill) return;

    updateSkill.mutate(
      {
        id: editingSkill.id,
        updates: {
          name: editingSkill.name,
          description: editingSkill.description,
          color: editingSkill.color,
          is_active: editingSkill.is_active,
        },
      },
      {
        onSuccess: () => setEditingSkill(null),
      }
    );
  }

  async function addSkill() {
    if (!newSkill.name.trim()) {
      return;
    }

    createSkill.mutate(
      {
        name: newSkill.name.trim(),
        description: newSkill.description.trim() || null,
        color: newSkill.color,
        is_active: newSkill.is_active,
      },
      {
        onSuccess: () => {
          setNewSkill({ name: '', description: '', color: '#3B82F6', is_active: true });
          setShowAddSkill(false);
        },
      }
    );
  }

  async function handleDeleteSkill(id: string) {
    if (
      !confirm(
        'Are you sure you want to delete this skill? This will remove it from all employees.'
      )
    )
      return;

    deleteSkill.mutate(id);
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b px-4 py-5 sm:px-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Skills</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage skills that can be assigned to employees
          </p>
        </div>
        <button
          onClick={() => setShowAddSkill(true)}
          className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          Create Skill
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {skills.map((skill) => (
            <li key={skill.id} className="px-4 py-4 sm:px-6">
              {editingSkill?.id === skill.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={editingSkill.name}
                      onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                      className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="e.g., JavaScript"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={editingSkill.description || ''}
                      onChange={(e) =>
                        setEditingSkill({ ...editingSkill, description: e.target.value })
                      }
                      className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Brief description"
                      maxLength={500}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Color (hex)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={editingSkill.color}
                          onChange={(e) =>
                            setEditingSkill({ ...editingSkill, color: e.target.value })
                          }
                          className="h-10 w-16 cursor-pointer rounded border-gray-300"
                        />
                        <input
                          type="text"
                          value={editingSkill.color}
                          onChange={(e) =>
                            setEditingSkill({ ...editingSkill, color: e.target.value })
                          }
                          className="flex-1 rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="#3B82F6"
                          pattern="^#[0-9A-Fa-f]{6}$"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
                      <label className="mt-2 flex items-center">
                        <input
                          type="checkbox"
                          checked={editingSkill.is_active}
                          onChange={(e) =>
                            setEditingSkill({ ...editingSkill, is_active: e.target.checked })
                          }
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={saveSkill}
                      disabled={updateSkill.isPending}
                      className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {updateSkill.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingSkill(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded border border-gray-300"
                        style={{ backgroundColor: skill.color }}
                        title={skill.color}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{skill.name}</p>
                        {skill.description && (
                          <p className="text-xs text-gray-500">{skill.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        skill.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {skill.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => setEditingSkill(skill)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {skills.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              No skills configured. Create one to get started.
            </li>
          )}
        </ul>
      )}

      {/* Add new skill form */}
      {showAddSkill && (
        <div className="border-t bg-gray-50 px-4 py-4 sm:px-6">
          <h4 className="mb-3 text-sm font-medium text-gray-900">Create New Skill</h4>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Name *</label>
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="e.g., JavaScript"
                maxLength={100}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Description (optional)
              </label>
              <input
                type="text"
                value={newSkill.description}
                onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Brief description"
                maxLength={500}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Color (hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newSkill.color}
                    onChange={(e) => setNewSkill({ ...newSkill, color: e.target.value })}
                    className="h-10 w-16 cursor-pointer rounded border-gray-300"
                  />
                  <input
                    type="text"
                    value={newSkill.color}
                    onChange={(e) => setNewSkill({ ...newSkill, color: e.target.value })}
                    className="flex-1 rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="#3B82F6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
                <label className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={newSkill.is_active}
                    onChange={(e) => setNewSkill({ ...newSkill, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={addSkill}
                disabled={createSkill.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {createSkill.isPending ? 'Creating...' : 'Create Skill'}
              </button>
              <button
                onClick={() => {
                  setShowAddSkill(false);
                  setNewSkill({ name: '', description: '', color: '#3B82F6', is_active: true });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
