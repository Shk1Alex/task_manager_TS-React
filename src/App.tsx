import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Trash2, ListTodo, Plus, ChevronDown, ChevronUp, Repeat, Play, XCircle } from 'lucide-react';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  startDate: Date | null;
  completed: boolean;
  subtasks: SubTask[];
  expanded: boolean;
  inProgress: boolean;
  isRecurring?: boolean;
  recurrencePattern?: 'weekly';
}

type TabType = 'active' | 'completed';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      return parsedTasks.map((task: any) => ({
        ...task,
        startDate: task.startDate ? new Date(task.startDate) : null
      }));
    }
    return [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      startDate: null,
      completed: false,
      subtasks: [],
      expanded: false,
      inProgress: false,
      isRecurring: isRecurring,
      recurrencePattern: isRecurring ? 'weekly' : undefined,
    };

    setTasks(prevTasks => {
      const newTasks = [...prevTasks, newTask];
      
      // If task is recurring, create future occurrences
      if (isRecurring) {
        const startDate = new Date();
        for (let i = 1; i <= 12; i++) { // Create 12 weekly occurrences
          const recurringTask = {
            ...newTask,
            id: crypto.randomUUID(),
            startDate: new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000),
          };
          newTasks.push(recurringTask);
        }
      }
      
      return newTasks;
    });

    setNewTaskTitle('');
    setIsRecurring(false);
    setShowNewTaskModal(false);
  };

  const addSubtask = (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: SubTask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle,
      completed: false,
    };

    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, subtasks: [...task.subtasks, newSubtask] }
        : task
    ));
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map(subtask =>
          subtask.id === subtaskId
            ? { ...subtask, completed: !subtask.completed }
            : subtask
        );
        const allSubtasksCompleted = updatedSubtasks.every(subtask => subtask.completed);
        
        return {
          ...task,
          subtasks: updatedSubtasks,
          completed: allSubtasksCompleted
        };
      }
      return task;
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId);
        return {
          ...task,
          subtasks: updatedSubtasks
        };
      }
      return task;
    }));
  };

  const toggleTaskExpanded = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, expanded: !task.expanded }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete?.isRecurring) {
      // Delete all recurring instances
      setTasks(tasks.filter(task => 
        !(task.isRecurring && 
          task.title === taskToDelete.title && 
          task.recurrencePattern === taskToDelete.recurrencePattern)
      ));
    } else {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const startTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, inProgress: true, startDate: new Date() }
        : task
    ));
  };

  const completeTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, completed: true }
        : task
    ));
  };

  const calculateProgress = (task: Task): number => {
    if (task.subtasks.length === 0) return 0;
    const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
  };

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-400" />
            Менеджер задач
          </h1>

          {/* Tabs */}
          <div className="flex mb-6 border-b border-gray-700">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'active'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('active')}
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Активные ({activeTasks.length})
              </div>
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'completed'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Завершенные ({completedTasks.length})
              </div>
            </button>
          </div>

          {/* New Task Modal */}
          {showNewTaskModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  Новая задача на {formatDate(selectedDate)}
                </h3>
                <form onSubmit={addTask}>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Название задачи"
                    className="w-full px-4 py-2 mb-4 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="recurring" className="text-gray-300 flex items-center gap-2">
                      <Repeat className="w-4 h-4" />
                      Повторять каждую неделю
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewTaskModal(false)}
                      className="px-4 py-2 text-gray-400 hover:text-gray-300"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                    >
                      Добавить
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Task Form */}
          {activeTab === 'active' && (
            <form onSubmit={addTask} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Введите название задачи"
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-500 text-gray-100 rounded-lg hover:bg-teal-600 transition-colors"
                >
                  Добавить
                </button>
              </div>
            </form>
          )}

          {/* Task List */}
          {(activeTab === 'active' || activeTab === 'completed') && (
            <div className="space-y-4">
              {(activeTab === 'active' ? activeTasks : completedTasks).map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-700 rounded-lg p-4 bg-gray-800 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleTaskExpanded(task.id)}
                          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-300"
                        >
                          {task.expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <h3 className="text-lg font-medium text-gray-100">
                          {task.title}
                          {task.isRecurring && (
                            <span className="ml-2 text-teal-400">
                              <Repeat className="w-4 h-4 inline" />
                            </span>
                          )}
                        </h3>
                      </div>
                      {task.startDate && (
                        <p className="text-sm text-gray-400">
                          Начало: {formatDate(task.startDate)}
                        </p>
                      )}
                      {activeTab === 'completed' && task.startDate && (
                        <p className="text-sm text-gray-400">
                          Завершено: {formatDate(new Date(task.startDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {activeTab === 'active' && !task.inProgress && (
                        <button
                          onClick={() => startTask(task.id)}
                          className="p-2 text-teal-400 hover:bg-teal-900/30 rounded-lg transition-colors"
                          title="Начать"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                      )}
                      {activeTab === 'active' && (
                        <button
                          onClick={() => completeTask(task.id)}
                          className="p-2 text-teal-400 hover:bg-teal-900/30 rounded-lg transition-colors"
                          title="Завершить"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-teal-500 transition-all duration-300"
                      style={{ width: `${calculateProgress(task)}%` }}
                    />
                  </div>

                  {/* Subtasks */}
                  {task.expanded && (
                    <div className="mt-4 space-y-4">
                      {activeTab === 'active' && (
                        <form onSubmit={(e) => addSubtask(task.id, e)} className="flex gap-2">
                          <input
                            type="text"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            placeholder="Добавить подзадачу"
                            className="flex-1 px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                          <button
                            type="submit"
                            className="p-2 text-teal-400 hover:bg-teal-900/30 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </form>
                      )}

                      <div className="space-y-2">
                        {task.subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            className={`flex items-center gap-2 p-2 rounded ${
                              activeTab === 'active' ? 'hover:bg-gray-700' : ''
                            } ${subtask.completed ? 'opacity-50' : ''}`}
                          >
                            {activeTab === 'active' && task.inProgress && (
                              <button
                                onClick={() => toggleSubtask(task.id, subtask.id)}
                                className={`p-1 rounded-full border ${
                                  subtask.completed
                                    ? 'bg-teal-500 border-teal-500 text-gray-900'
                                    : 'border-gray-600 hover:border-teal-500 text-gray-400'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            <span className={`text-sm text-gray-300 ${subtask.completed ? 'line-through' : ''}`}>
                              {subtask.title}
                            </span>
                            {activeTab === 'active' && (
                              <button
                                onClick={() => deleteSubtask(task.id, subtask.id)}
                                className="p-1 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Удалить подзадачу"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(activeTab === 'active' ? activeTasks : completedTasks).length === 0 && (
                <p className="text-center text-gray-400 py-8">
                  {activeTab === 'active'
                    ? 'Нет активных задач'
                    : 'Нет завершенных задач'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;