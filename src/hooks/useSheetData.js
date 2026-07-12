import { useState, useCallback, useMemo } from 'react';
import { fetchSheetData } from '../services/googleSheet';
import {
  parseSheetCSV,
  filterValidRows,
  getUniquePEAs,
  getUniqueGroups,
  getPEASummary,
  getOverallSummary,
  MONITOR_PEAS,
} from '../utils/parseCSV';
import { toast } from 'sonner';

export default function useSheetData() {
  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPEAs, setSelectedPEAs] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [monitorMode, setMonitorMode] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const csvText = await fetchSheetData();
      const parsed = parseSheetCSV(csvText);
      const valid = filterValidRows(parsed);
      setRawData(valid);
      toast.success('โหลดข้อมูลสำเร็จ', {
        description: `${valid.length} รายการจาก ${getUniquePEAs(valid).length} หน่วยงาน`,
      });
    } catch (err) {
      console.error('Failed to load sheet data:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลได้');
      toast.error('โหลดข้อมูลล้มเหลว', {
        description: err.message || 'กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectPEA = useCallback((peaOrList) => {
    if (Array.isArray(peaOrList)) {
      setSelectedPEAs(peaOrList);
      if (peaOrList.length > 0) setMonitorMode(false);
    } else if (peaOrList === null || peaOrList === undefined) {
      return;
    } else {
      setSelectedPEAs((prev) => {
        const next = prev.includes(peaOrList) ? prev.filter((p) => p !== peaOrList) : [...prev, peaOrList];
        return next;
      });
      setMonitorMode(false);
    }
  }, []);

  const handleSelectGroup = useCallback((groupOrList) => {
    if (Array.isArray(groupOrList)) {
      setSelectedGroups(groupOrList);
    } else {
      setSelectedGroups((prev) =>
        prev.includes(groupOrList) ? prev.filter((g) => g !== groupOrList) : [...prev, groupOrList]
      );
    }
    setMonitorMode(false);
  }, []);

  const handleToggleMonitor = useCallback(() => {
    setMonitorMode((prev) => {
      if (!prev) {
        setSelectedGroups([]);
        setSelectedPEAs([...MONITOR_PEAS]);
        return true;
      }
      setSelectedPEAs([]);
      return false;
    });
  }, []);

  const activeData = useMemo(() => {
    let data = [...rawData];

    if (selectedGroups.length > 0) {
      data = data.filter((row) => selectedGroups.includes(row.group));
    }
    if (selectedPEAs.length > 0) {
      data = data.filter((row) => selectedPEAs.includes(row.pea));
    }

    if (monitorMode) {
      data = data.toSorted((a, b) => {
        const orderMap = {};
        MONITOR_PEAS.forEach((pea, idx) => { orderMap[pea] = idx; });
        return (orderMap[a.pea] ?? 999) - (orderMap[b.pea] ?? 999);
      });
    }

    return data;
  }, [rawData, monitorMode, selectedGroups, selectedPEAs]);

  const peas = useMemo(() => {
    const list = getUniquePEAs(activeData);
    return [...list].sort((a, b) => {
      const ia = MONITOR_PEAS.indexOf(a);
      const ib = MONITOR_PEAS.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b, 'th');
    });
  }, [activeData]);

  const allPeas = useMemo(() => getUniquePEAs(rawData), [rawData]);
  const groups = useMemo(() => getUniqueGroups(rawData), [rawData]);
  const summaries = useMemo(() => peas.map((pea) => getPEASummary(activeData, pea)), [activeData, peas]);
  const overallSummary = useMemo(() => getOverallSummary(activeData), [activeData]);

  return {
    rawData,
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
  };
}
