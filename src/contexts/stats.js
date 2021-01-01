import React from 'react';
// import * as ethers from 'ethers';
import { Big, isZero } from 'utils/big-number';
import { useWallet } from 'contexts/wallet';
import * as request from 'utils/request';

const CAKE_APY = Big('115');

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
  const [stakingEndSec, setProgramDuration] = React.useState(0);
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

      const sa = await Promise.all([
        stakingContract.totalLockedShares(),
        stakingContract.totalLocked(),
      ]);
      const s = Big(sa[0]).div(1e18);
      const a = Big(sa[1]);
      const m = parseInt(Date.now() / 1e3);
      const i = Big((60 * 60 * 24 * 30).toString()); // 2592e3

      const ip = (t, e) => (t.gte(e) ? t : e);
      const op = (t, e) => (t.lte(e) ? t : e);

      const vaa = schedules.reduce((t, schedule) => {
        return t.add(
          op(ip(schedule.endAtSec.sub(m), Big('0')), i)
            .div(schedule.durationSec)
            .mul(schedule.initialLockedShares)
        );
      }, Big('0'));

      const monthlyUnlockRate = isZero(a)
        ? Big('0')
        : vaa
            .div(a)
            .mul(s)
            .add(CAKE_APY.div(12));

      let apy = monthlyUnlockRate.div(N).mul(12);
      // console.log(vaa.toString(), a.toString(), s.toString());
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
    const [
      availableCakeRewards,
      totalStakedFor,
      [, userStakingShareSeconds, totalStakingShareSeconds],
    ] = await Promise.all([
      stakingContract.pendingCakeByUser(address),
      stakingContract.totalStakedFor(address),
      stakingContract.callStatic.updateAccounting(),
    ]);
    const availableDittoRewards = await stakingContract.callStatic.unstakeQuery(
      totalStakedFor
    );
    setAvailableCakeRewards(Big(availableCakeRewards));
    setTotalStakedFor(Big(totalStakedFor));
    setAvailableDittoRewards(Big(availableDittoRewards));
    setTotalStakingShareSeconds(Big(totalStakingShareSeconds));
    setUserStakingShareSeconds(Big(userStakingShareSeconds));
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
        stakingEndSec,
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
    stakingEndSec,
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
    stakingEndSec,
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
