import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage countdown timer for requests
 */
export function useTimer(createdAt, onExpire = null) {
  const [remaining, setRemaining] = useState(300000); // start at 5m

  useEffect(() => {
    if (!createdAt) return;

    const calculateRemaining = () => {
      const createdTime = new Date(createdAt).getTime();
      const expiresTime = createdTime + (5 * 60 * 1000); // 5 minutes
      const now = Date.now();
      const diff = Math.max(0, expiresTime - now);
      
      setRemaining(diff);

      if (diff <= 0 && onExpire) {
        onExpire();
      }
      return diff;
    };

    const diff = calculateRemaining();
    if (diff <= 0) return; // already expired

    const interval = setInterval(() => {
      const currentDiff = calculateRemaining();
      if (currentDiff <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, onExpire]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return { remaining, formatted };
}

/**
 * Hook to fetch and manage demands/leads
 */
export function useDemandes(role = 'client') {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      if (role === 'client') {
        const [demandesRes, offersRes] = await Promise.all([
          fetch('/api/demandes', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/offers', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (demandesRes.ok && offersRes.ok) {
          let data = await demandesRes.json();
          const offersData = await offersRes.json();
          
          data = data.map(req => {
            const mappedReq = { ...req };
            // normalize status for UI
            if (mappedReq.status === 'open' || mappedReq.status === 'waiting') {
               mappedReq.status = 'active'; 
            }
            mappedReq.offers = (offersData || []).filter(o => String(o.demande_id) === String(req.id));
            return mappedReq;
          });
          setDemandes(data);
        }
      } else {
        // mechanic
        const [demandesRes, interventionsRes] = await Promise.all([
          fetch('/api/demandes', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/interventions', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (demandesRes.ok && interventionsRes.ok) {
          const data = await demandesRes.json();
          const interventionsData = await interventionsRes.json();
          
          const mappedData = data.map(req => {
            const mappedReq = { ...req };
            const myOffer = (interventionsData || []).find(o => String(o.demande_id) === String(req.id));
            if (myOffer) {
              if (myOffer.status === 'pending') myOffer.status = 'en_attente';
              if (myOffer.status === 'rejected') myOffer.status = 'refused';
              mappedReq.my_offer = myOffer;
            }
            return mappedReq;
          });
          setDemandes(mappedData);
        }
      }
    } catch (error) {
      console.error('Error fetching demandes:', error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { demandes, loading, refresh };
}
