import React from 'react';
// import * as ethers from 'ethers';
import { Big, isZero } from 'utils/big-number';
import { useWallet } from 'contexts/wallet';
import * as request from 'utils/request';

const StatsContext = React.createContext(null);

export function StatsProvider({ children }) {
  const {
    stakingContract,
    lpContract,
    wrappedBNBContract,
    dittoContract,
    lpAddress,
    lpDecimals,
    wrappedBNBDecimals,
    dittoDecimals,
    address,
  } = useWallet();

  const [apy, setAPY] = React.useState(Big('0'));
  const [monthlyUnlockRate, setMonthlyUnlockRate] = React.useState(Big('0'));
  const [totalDeposits, setTotalDeposits] = React.useState(Big('0'));
  const [programDuration, setProgramDuration] = React.useState(0);
  const [availableDittoRewards, setAvailableDittoRewards] = React.useState(
    Big('0')
  );
  const [availableCakeRewards, setAvailableCakeRewards] = React.useState(
    Big('0')
  );

  const [totalStakingShares, setTotalStakingShares] = React.useState(Big('0'));
  const [totalStaked, setTotalStaked] = React.useState(Big('0'));
  const [
    totalStakingShareSeconds,
    setTotalStakingShareSeconds,
  ] = React.useState(Big('0'));
  const [totalStakedFor, setTotalStakedFor] = React.useState(Big('0'));
  const [userStakingShareSeconds, setUserStakingShareSeconds] = React.useState(
    Big('0')
  );

  const loadStats = async () => {
    if (
      !(
        stakingContract &&
        lpContract &&
        wrappedBNBContract &&
        dittoContract &&
        lpAddress
      )
    )
      return;
    const v = await Promise.all([
      0, // stakingContract.updateAccounting(), // 0
      stakingContract.totalStaked(), // 1
      stakingContract.totalLockedShares(), // 2
      stakingContract.unlockScheduleCount(), // 3
      stakingContract.totalStakingShares(), // 4
      0, // i.methods.totalSupply(), // 5
      lpContract.totalSupply(), // 6
      wrappedBNBContract.balanceOf(lpAddress), // 7
      dittoContract.balanceOf(lpAddress), // 8
    ]);

    setTotalStakingShares(Big(v[4]));
    setTotalStaked(Big(v[1]));
    setUserStakingShareSeconds(Big(v[4])); // parseInt(totalStakingShares), parseInt(updateAccounting[2]))

    // const l = 18;
    const c = lpDecimals; // lp
    const p = wrappedBNBDecimals; // bnb
    const m = dittoDecimals; // ditto

    // const g = parseInt(v[0][0]) / 10 ** l;
    // const y = parseInt(v[0][1]) / 10 ** l;
    // const b = parseInt(v[0][5]);
    const w = Big(v[1]).div(10 ** c);
    // const _ = parseInt(v[2]);
    // const x = parseInt(v[3]);
    // const S = parseInt(v[5]) / 10 ** l;
    const E = Big(v[6]).div(10 ** c);
    // const M = yield up(h)
    // const k = yield up(f)
    // const A = yield up(d)
    const T = Big(v[7]).div(10 ** p);
    const C = Big(v[8]).div(10 ** m);

    const [k, A] = await getCoinUsdPrices(['wbnb', 'ditto']);
    const O = k.mul(T);
    const P = A.mul(C);

    const I = w.div(E);
    const N = O.add(P).mul(I);

    // console.log(
    //   Object.entries({ N, O, P, I, k, T, A, C, w, E }).reduce((r, [k, v]) => {
    //     r[k] = v.toString();
    //     return r;
    //   }, {})
    // );

    // console.log('deposits', N.toString());
    setTotalDeposits(Big(N));

    const noOfSchedules = await stakingContract.unlockScheduleCount();
    // const noOfSchedules = ethers.BigNumber.from('1');
    if (!noOfSchedules.isZero()) {
      const schedules = [];

      for (let b = 0; b < noOfSchedules.toNumber(); b++) {
        const schedule = await stakingContract.unlockSchedules(
          noOfSchedules.sub(1).toNumber()
        );
        schedules.push({
          initialLockedShares: Big(schedule.initialLockedShares),
          unlockedShares: Big(schedule.unlockedShares),
          lastUnlockTimestampSec: Big(schedule.lastUnlockTimestampSec),
          endAtSec: Big(schedule.endAtSec),
          durationSec: Big(schedule.durationSec),
        });
      }

      setProgramDuration(schedules[schedules.length - 1].endAtSec);

      const [s, a] = await Promise.all([
        stakingContract.totalLockedShares(),
        stakingContract.totalLocked(),
      ]);

      const i = Big((60 * 60 * 24 * 30).toString()); // 2592e3

      const ip = (t, e) => (t.gte(e) ? t : e);
      const op = (t, e) => (t.lte(e) ? t : e);

      const hha = schedules.reduce((t, schedule) => {
        return t.add(
          op(ip(schedule.endAtSec.sub(m), Big('0')), i)
            .div(schedule.durationSec)
            .mul(schedule.initialLockedShares)
        );
      }, Big('0'));

      const monthlyUnlockRate = isZero(a)
        ? Big('0')
        : hha
            .div(a)
            .mul(s)
            .div(N);
      let apy = monthlyUnlockRate.mul(12);
      console.log(monthlyUnlockRate.toString());
      if (apy.gte(1e6)) {
        apy = Big(1e6);
      }

      // console.log('apy', apy.toString());
      setMonthlyUnlockRate(Big(monthlyUnlockRate));
      setAPY(Big(apy));
    }
  };

  React.useEffect(() => {
    loadStats(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stakingContract,
    lpContract,
    wrappedBNBContract,
    dittoContract,
    lpAddress,
    lpDecimals,
    wrappedBNBDecimals,
    dittoDecimals,
  ]);

  const loadUserStats = async () => {
    if (!(stakingContract && address)) return;
    const [availableCakeRewards, totalStakedFor] = await Promise.all([
      stakingContract.pendingCakeByUser(address),
      stakingContract.totalStakedFor(address),
    ]);
    setAvailableCakeRewards(Big(availableCakeRewards));
    setTotalStakedFor(Big(totalStakedFor));

    setAvailableDittoRewards(
      await stakingContract.callStatic.unstakeQuery(totalStakedFor)
    );

    // Promise.all([
    //   totalLocked(),
    //   totalUnlocked(),
    //   totals.stakingShareSeconds,
    // _totalStakingShareSeconds,
    // totalUserRewards,
    // now

    const [
      ,
      ,
      stakingShareSeconds,
    ] = await stakingContract.callStatic.updateAccounting();
    setTotalStakingShareSeconds(Big(stakingShareSeconds));
  };

  React.useEffect(() => {
    loadUserStats();
  }, [stakingContract, address]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StatsContext.Provider
      value={{
        apy,
        monthlyUnlockRate,
        totalDeposits,
        programDuration,
        availableDittoRewards,
        availableCakeRewards,

        totalStakingShares,
        totalStaked,
        totalStakingShareSeconds,
        totalStakedFor,
        userStakingShareSeconds,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = React.useContext(StatsContext);
  if (!context) {
    throw new Error('Missing stats context');
  }
  const {
    apy,
    monthlyUnlockRate,
    totalDeposits,
    programDuration,
    availableDittoRewards,
    availableCakeRewards,

    totalStakingShares,
    totalStaked,
    totalStakingShareSeconds,
    totalStakedFor,
    userStakingShareSeconds,
  } = context;

  return {
    apy,
    monthlyUnlockRate,
    totalDeposits,
    programDuration,
    availableDittoRewards,
    availableCakeRewards,

    totalStakingShares,
    totalStaked,
    totalStakingShareSeconds,
    totalStakedFor,
    userStakingShareSeconds,
  };
}

async function getCoinUsdPrices(assetsCoinGeckoIds) {
  const prices = await request.get(
    'https://api.coingecko.com/api/v3/simple/price',
    {
      ids: assetsCoinGeckoIds.join(','),
      vs_currencies: 'usd',
    }
  );
  return assetsCoinGeckoIds.map(id => Big(prices[id].usd));
}
