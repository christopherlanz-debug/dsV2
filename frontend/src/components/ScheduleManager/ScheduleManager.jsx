import { useState } from 'react';
import { Plus, Trash2, Edit, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' }
];

export default function ScheduleManager({ playlistId, schedules, onAdd, onDelete, onUpdate, playlistsAPI }) {
   console.log('ScheduleManager received schedules:', schedules);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    start_time: '09:00',
    end_time: '17:00',
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    is_active: true
  });

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormData({
      start_time: '09:00',
      end_time: '17:00',
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      start_time: schedule.start_time ? schedule.start_time.substring(0, 5) : '09:00',
      end_time: schedule.end_time ? schedule.end_time.substring(0, 5) : '17:00',
      monday: schedule.monday || false,
      tuesday: schedule.tuesday || false,
      wednesday: schedule.wednesday || false,
      thursday: schedule.thursday || false,
      friday: schedule.friday || false,
      saturday: schedule.saturday || false,
      sunday: schedule.sunday || false,
      is_active: schedule.is_active !== undefined ? schedule.is_active : true
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.start_time >= formData.end_time) {
      toast.error('Start time must be before end time');
      return;
    }

    try {
      if (editingSchedule) {
        await onUpdate(playlistId, editingSchedule.id, formData);
        toast.success('Schedule updated');
      } else {
        await onAdd(playlistId, formData);
        toast.success('Schedule created');
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDuplicate = async (schedule) => {
    try {
      await onAdd(playlistId, {
        start_time: schedule.start_time ? schedule.start_time.substring(0, 5) : '09:00',
        end_time: schedule.end_time ? schedule.end_time.substring(0, 5) : '17:00',
        monday: schedule.monday,
        tuesday: schedule.tuesday,
        wednesday: schedule.wednesday,
        thursday: schedule.thursday,
        friday: schedule.friday,
        saturday: schedule.saturday,
        sunday: schedule.sunday,
        is_active: true
      });
      toast.success('Schedule duplicated');
    } catch (error) {
      toast.error('Failed to duplicate');
    }
  };

  const getDaysLabel = (schedule) => {
    const activeDays = DAYS.filter(d => schedule[d.key]).map(d => d.label);
    return activeDays.length === 7 ? 'Every day' : activeDays.join(', ') || 'No days';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Schedules</h3>
        <button
          onClick={handleOpenAdd}
          className="btn btn-sm btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Schedule
        </button>
      </div>

      {schedules && schedules.length === 0 ? (
        <div className="text-center py-6 text-gray-500 border rounded-lg">
          <p>No schedules - this playlist always plays when assigned</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules && schedules.map((schedule) => (
            <div key={schedule.id} className="p-3 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">
                    {schedule.start_time ? schedule.start_time.substring(0, 5) : '—'} - {schedule.end_time ? schedule.end_time.substring(0, 5) : '—'}
                  </p>
                  <p className="text-xs text-gray-500">{getDaysLabel(schedule)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  schedule.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {schedule.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleDuplicate(schedule)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(schedule)}
                  className="text-gray-600 hover:text-gray-800"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(playlistId, schedule.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card max-w-md w-full my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Days of Week</label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day) => (
                    <label key={day.key} className="flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[day.key] || false}
                        onChange={(e) => setFormData({ ...formData, [day.key]: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="ml-1 text-sm text-center flex-1">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Active</span>
              </label>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingSchedule ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
