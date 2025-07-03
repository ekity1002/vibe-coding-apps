import type { FilterTabsProps, FilterType } from "@/types";

const filterLabels: Record<FilterType, string> = {
  all: 'すべて',
  active: '未完了',
  completed: '完了済み'
};

export function FilterTabs({ filter, setFilter, totalCount }: FilterTabsProps) {
  if (totalCount === 0) return null;

  const filters: FilterType[] = ['all', 'active', 'completed'];

  return (
    <div className="flex justify-center mb-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
        {filters.map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              filter === filterType
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {filterLabels[filterType]}
          </button>
        ))}
      </div>
    </div>
  );
}