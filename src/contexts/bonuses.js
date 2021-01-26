import React from 'react';
import * as ethers from 'ethers';
import { useWallet } from 'contexts/wallet';
import * as request from 'utils/request';
import DROP_ABI from 'abis/merkle.json';
import { NETWORK } from 'config';

const BonusesContext = React.createContext(null);

export function BonusesProvider({ children }) {
  const { signer, address } = useWallet();

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [drops, setDrops] = React.useState([]);

  const hasPendingBonusClaim = React.useMemo(
    () => !!drops.filter(d => d.hasPendingClaim).length,
    [drops]
  );

  React.useEffect(() => {
    if (!(signer && address)) return setDrops([]);

    let isMounted = true;
    const unsubs = [() => (isMounted = false)];
    const dropsConfig = Array.from(NETWORK.drops.entries()).map(
      ([contractAddress, date]) => ({
        date,
        contract: new ethers.Contract(contractAddress, DROP_ABI, signer),
      })
    );

    const loadDrops = async () => {
      const ds = await Promise.all(dropsConfig.map(loadDrop));

      if (isMounted) {
        setDrops(ds);
        setIsLoaded(true);
      }
    };

    const loadDrop = async ({ contract, date }) => {
      const claimInfo = await request.api(`/claim-info/${date}/${address}`);
      let didClaim = false;

      const canClaim = 'index' in claimInfo;
      if (canClaim) {
        didClaim = await contract.isClaimed(claimInfo.index);
      }

      return {
        address,
        date,
        contract,
        claimInfo,
        canClaim,
        didClaim,
        hasPendingClaim: canClaim && !didClaim,
      };
    };

    const subscribe = () => {
      dropsConfig.forEach(({ contract }) => {
        // const claimEvent = contract.filters.Claimed(null, address);
        const claimEvent = contract.filters.Claimed();
        contract.on(claimEvent, loadDrops);
        unsubs.push(() => contract.off(claimEvent, loadDrops));
      });
    };

    loadDrops();
    subscribe();
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [signer, address]);

  return (
    <BonusesContext.Provider
      value={{
        isLoaded,
        drops,
        hasPendingBonusClaim,
      }}
    >
      {children}
    </BonusesContext.Provider>
  );
}

export function useBonuses() {
  const context = React.useContext(BonusesContext);
  if (!context) {
    throw new Error('Missing bonuses context');
  }
  const { isLoaded, drops, hasPendingBonusClaim } = context;

  return {
    isLoaded,
    drops,
    hasPendingBonusClaim,
  };
}
