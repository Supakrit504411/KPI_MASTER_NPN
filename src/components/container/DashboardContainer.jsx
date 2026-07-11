import { useState, useEffect, useMemo } from 'react';
import useSheetData from '../../hooks/useSheetData';
import useNotes from '../../hooks/useNotes';
import useLiff from '../../hooks/useLiff';

import Header from '../presentational/Header';
import OverallSummaryCards from '../presentational/OverallSummaryCards';
import PEASummaryTable from '../presentational/PEASummaryTable';
import GroupFilter from '../presentational/GroupFilter';
import PEAFilter from '../presentational/PEAFilter';
import StatusFilter from '../presentational/StatusFilter';
import ItemComparison from '../presentational/ItemComparison';
import DataTable from '../presentational/DataTable';
import LoadingSpinner from '../presentational/LoadingSpinner';
import ErrorMessage from '../presentational/ErrorMessage';
import SummaryScoreTable from '../presentational/SummaryScoreTable';
import { getUniqueItems } from '../../utils/parseCSV';
import { Monitor, Layers, LogIn } from 'lucide-react';

export default function DashboardContainer() {
  const {
    activeData,
    isLoading,
    error,
    selectedPEAs,
    selectedGroups,
    monitorMode,
    peas,
    allPeas,
    groups,
    summaries,
    overallSummary,
    loadData,
    handleSelectPEA,
    handleSelectGroup,
    handleToggleMonitor,
  } = useSheetData();

  const { notes, handleNoteChange, handleSaveNote } = useNotes();
  const liff = useLiff();
  const [activeStatus, setActiveStatus] = useState(null);
  const [cardFilter, setCardFilter] = useState({ pea: null, status: null });
  const [highlightedItem, setHighlightedItem] = useState(null);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetDetailFilters = () => {
    setActiveStatus(null);
    setCardFilter({ pea: null, status: null });
  };

  const resetAllFilters = () => {
    // Clear all multi-select filters (batch operations)
    handleSelectGroup([]);
    handleSelectPEA([]);
  };

  const handleOverallStatusClick = (status) => {
    setActiveStatus((prev) => (prev === status ? null : status));
    setCardFilter({ pea: null, status: null });
    // Clear all PEA selections (batch operation)
    if (selectedPEAs && selectedPEAs.length > 0) {
      handleSelectPEA([]);
    }
  };

  const handlePEACardClick = (pea, status) => {
    const next = { pea, status };
    setCardFilter((prev) =>
      prev.pea === pea && prev.status === status ? { pea: null, status: null } : next
    );
    setActiveStatus(null);
    handleSelectPEA(pea);
  };

  const finalData = useMemo(() => {
    let data = activeData;

    if (cardFilter.pea || cardFilter.status) {
      data = data.filter((row) => {
        const matchPEA = cardFilter.pea ? row.pea === cardFilter.pea : true;
        const matchStatus = cardFilter.status ? row.status === cardFilter.status : true;
        return matchPEA && matchStatus;
      });
    } else if (activeStatus) {
      data = data.filter((row) => row.status === activeStatus);
    }

    return data;
  }, [activeData, activeStatus, cardFilter]);

  const effectivePEA = cardFilter.pea;
  const effectiveStatus = cardFilter.status || activeStatus;
  const items = useMemo(() => getUniqueItems(activeData), [activeData]);

  // Handle item selection from SummaryScoreTable or DataTable row click
  const handleItemSelect = (item) => {
    setHighlightedItem((prev) => (prev === item ? null : item));
  };

  // Handle item selection from ItemComparison list (toggle on/off)
  const handleItemComparisonSelect = (item) => {
    if (item === highlightedItem) {
      setHighlightedItem(null);
    } else {
      setHighlightedItem(item);
    }
  };

  // บังคับ login ก่อนเห็นข้อมูลใดๆ
  if (!liff.ready) {
    return <LoadingSpinner message="กำลังเตรียมระบบล็อกอิน..." />;
  }

  if (!liff.loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center space-y-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">PEA Dashboard</h1>
            <p className="text-sm text-gray-500">แดชบอร์ดสรุปผลการประเมิน KPI</p>
          </div>
          <p className="text-sm text-gray-600">กรุณาเข้าสู่ระบบด้วย LINE เพื่อใช้งาน</p>
          <button
            onClick={liff.login}
            className="w-full flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34d] text-white font-semibold py-3 px-6 rounded-xl transition-colors text-base"
          >
            <LogIn className="w-5 h-5" />
            เข้าสู่ระบบด้วย LINE
          </button>
          <p className="text-xs text-gray-400">ระบบจะเก็บประวัติการเข้าใช้งานและการแก้ไขข้อมูล</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="กำลังโหลดข้อมูลจาก Google Sheet..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header onRefresh={loadData} isLoading={isLoading} liff={liff} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {(selectedPEAs.length > 0 || selectedGroups.length > 0 || effectiveStatus) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm text-blue-700">
              กำลังกรอง:
              {selectedPEAs.length > 0 && (
                <span className="ml-1">
                  <strong>หน่วยงาน: {selectedPEAs.join(', ')}</strong>
                </span>
              )}
              {selectedGroups.length > 0 && (
                <span className="ml-1">
                  <strong>กลุ่ม: {selectedGroups.join(', ')}</strong>
                </span>
              )}
              {selectedPEAs.length === 0 && selectedGroups.length === 0 && effectiveStatus && (
                <span className="ml-1">|</span>
              )}
              {effectiveStatus && (
                <span className="ml-1">
                  <strong>
                    {effectiveStatus === 'passed' && 'ผ่านเกณฑ์'}
                    {effectiveStatus === 'failed' && 'ไม่ผ่าน'}
                    {effectiveStatus === 'pending' && 'รอผล'}
                  </strong>
                </span>
              )}
              <span className="text-gray-500 ml-2">({finalData.length} รายการ)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                resetDetailFilters();
                resetAllFilters();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}

        {monitorMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-sm text-amber-700 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <strong>Monitor Mode:</strong> แสดงเฉพาะ 4 PEA ที่ติดตามบ่อย
              <span className="text-gray-500 ml-1">({finalData.length} รายการ)</span>
            </span>
            <span className="text-xs text-amber-700/80">
              ปิด Monitor เพื่อเลือก Group หรือ PEA
            </span>
          </div>
        )}

        {peas.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm text-orange-700">
              ไม่พบหน่วยงานตามเงื่อนไขตัวกรองปัจจุบัน กรุณาปรับตัวกรองใหม่
            </span>
            <button
              type="button"
              onClick={() => {
                resetDetailFilters();
                resetAllFilters();
              }}
              className="text-xs text-orange-700 hover:text-orange-900 underline"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}

        <section>
          <OverallSummaryCards
            summary={overallSummary}
            activeStatus={activeStatus}
            onStatusClick={handleOverallStatusClick}
          />
        </section>

        <section className="space-y-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <GroupFilter
              groups={groups}
              selectedGroups={selectedGroups}
              disabled={monitorMode}
              onSelectGroup={(group) => {
                handleSelectGroup(group);
                resetDetailFilters();
              }}
            />

            <PEAFilter
              peas={allPeas}
              selectedPEAs={selectedPEAs}
              monitorMode={monitorMode}
              disabled={monitorMode}
              onSelectPEA={(pea) => {
                handleSelectPEA(pea);
                resetDetailFilters();
              }}
              onToggleMonitor={() => {
                handleToggleMonitor();
                resetDetailFilters();
              }}
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full inline-block" />
            สรุปผลงานรายหน่วยงาน
            <span className="text-sm font-normal text-gray-400">(คลิกที่ตัวเลขเพื่อกรอง)</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
              {peas.length} หน่วยงาน
            </span>
          </h2>
          <PEASummaryTable
            summaries={summaries}
            activePEA={effectivePEA}
            activeStatus={effectiveStatus}
            onCardClick={handlePEACardClick}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full inline-block" />
            ตารางสรุปคะแนน KPIs
            <span className="text-sm font-normal text-gray-400">(เรียงข้อที่ × PEA ที่เลือก)</span>
          </h2>
          <SummaryScoreTable
            rawData={activeData}
            selectedPEAs={selectedPEAs.length > 0 ? selectedPEAs : peas}
            onItemSelect={handleItemSelect}
            highlightedItem={highlightedItem}
          />
        </section>

        <section>
          <ItemComparison
            rawData={activeData}
            items={items}
            highlightedItem={highlightedItem}
            onSelectedItemChange={handleItemComparisonSelect}
          />
        </section>

        <section>
          <div className="flex flex-col gap-3 mb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full inline-block" />
                ตารางข้อมูลรายละเอียด
              </h2>
              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Group Quick Filter */}
                <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Group:</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectGroup([]);
                    handleSelectPEA([]);
                    setActiveStatus(null);
                    setCardFilter({ pea: null, status: null });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border
                    ${selectedGroups.length === 0 && selectedPEAs.length === 0 && !activeStatus
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                  ทั้งหมด
                </button>
                {groups.map((group) => {
                  const isSelected = selectedGroups.includes(group);
                  const groupColors = {
                    NE1: { selected: 'bg-sky-500 text-white border-sky-500', idle: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' },
                    S: { selected: 'bg-purple-500 text-white border-purple-500', idle: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' },
                    'จุดรวมงาน': { selected: 'bg-amber-500 text-white border-amber-500', idle: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' },
                  };
                  const colors = groupColors[group] || { selected: 'bg-blue-500 text-white border-blue-500', idle: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' };
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => {
                        handleSelectGroup(group);
                        resetDetailFilters();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border
                        ${isSelected ? colors.selected : colors.idle}`}
                    >
                      {group}
                    </button>
                  );
                })}
                {/* Monitor Quick Filter */}
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button
                  type="button"
                  onClick={() => {
                    handleToggleMonitor();
                    resetDetailFilters();
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border
                    ${monitorMode
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-amber-50'}`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Monitor (4PEA)
                </button>
              </div>
            </div>
            <StatusFilter
              activeStatus={activeStatus}
              onSelectStatus={(status) => {
                setActiveStatus(status);
                setCardFilter({ pea: null, status: null });
                handleSelectPEA(null);
              }}
            />
          </div>

          <DataTable
            data={finalData}
            notes={notes}
            onNoteChange={handleNoteChange}
            onSaveNote={handleSaveNote}
            highlightedItem={highlightedItem}
            onItemSelect={handleItemSelect}
            highlightedItemFromComparison={highlightedItem}
            lineProfile={liff.loggedIn ? liff.profile : null}
          />
        </section>
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-200 mt-8">
        PEA Dashboard | ข้อมูลจาก Google Sheet (LMS) | อัปเดตล่าสุด:{' '}
        {new Date().toLocaleDateString('th-TH')}
      </footer>
    </div>
  );
}
