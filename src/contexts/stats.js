import React from 'react';
import { Big, isZero } from 'utils/big-number';
import { useWallet } from 'contexts/wallet';
import * as request from 'utils/request';

const CAKE_APY = Big('115');

const StatsContext = React.createContext(null);

const max = (t, e) => (t.gte(e) ? t : e);
const min = (t, e) => (t.lte(e) ? t : e);

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

  // pool

  const [totalStaked, setTotalStaked] = React.useState(Big('0'));
  const [totalLockedShares, setTotalLockedShares] = React.useState(Big('0'));
  const [unlockScheduleCount, setUnlockScheduleCount] = React.useState(
    Big('0')
  );
  const [totalStakingShares, setTotalStakingShares] = React.useState(Big('0'));
  const [totalLocked, setTotalLocked] = React.useState(Big('0'));
  const [totalSupply, setTotalSupply] = React.useState(Big('0'));
  const [startBonus, setStartBonus] = React.useState(Big('0'));
  const [bonusPeriodSec, setBonusPeriodSec] = React.useState(Big('0'));
  const [poolBNBBalance, setPoolBNBBalance] = React.useState(Big('0'));
  const [poolDittoBalance, setPoolDittoBalance] = React.useState(Big('0'));
  const [schedules, setUnlockSchedules] = React.useState([]);
  const [bnbUSDPrice, setBNBUSDPrice] = React.useState(Big('0'));
  const [dittoUSDPrice, setDittoUSDPrice] = React.useState(Big('0'));

  // user

  const [availableDittoRewards, setAvailableDittoRewards] = React.useState(
    Big('0')
  );
  const [availableCakeRewards, setAvailableCakeRewards] = React.useState(
    Big('0')
  );
  const [totalStakedFor, setTotalStakedFor] = React.useState(Big('0'));
  const [
    totalStakingShareSeconds,
    setTotalStakingShareSeconds,
  ] = React.useState(Big('0'));
  const [userStakingShareSeconds, setUserStakingShareSeconds] = React.useState(
    Big('0')
  );
  const [totalUserRewards, setTotalUserRewards] = React.useState(Big('0'));

  const totalUSDDeposits = React.useMemo(() => {
    if (
      !(
        !isZero(totalStaked) &&
        !isZero(totalSupply) &&
        !isZero(poolBNBBalance) &&
        !isZero(poolDittoBalance) &&
        !isZero(bnbUSDPrice) &&
        !isZero(dittoUSDPrice) &&
        dittoDecimals &&
        lpDecimals &&
        wrappedBNBDecimals
      )
    )
      return Big('0');

    const k = bnbUSDPrice;
    const A = dittoUSDPrice;

    // const l = 18;
    const c = lpDecimals; // lp
    const p = wrappedBNBDecimals; // bnb
    const m = dittoDecimals; // ditto

    // const g = parseInt(v[0][0]) / 10 ** l;
    // const y = parseInt(v[0][1]) / 10 ** l;
    // const b = parseInt(v[0][5]);
    const w = Big(totalStaked).div(10 ** c);
    // const _ = parseInt(totalLockedShares);
    // const x = parseInt(unlockScheduleCount);
    // const S = parseInt(v[5]) / 10 ** l;
    const E = Big(totalSupply).div(10 ** c);
    // const M = yield up(h)
    // const k = yield up(f)
    // const A = yield up(d)
    const T = Big(poolBNBBalance).div(10 ** p);
    const C = Big(poolDittoBalance).div(10 ** m);

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

    return N;
  }, [
    totalStaked,
    totalSupply,
    poolBNBBalance,
    poolDittoBalance,
    bnbUSDPrice,
    dittoUSDPrice,
    dittoDecimals,
    lpDecimals,
    wrappedBNBDecimals,
  ]);

  const stakingEndSec = React.useMemo(
    () =>
      !schedules.length ? Big('0') : schedules[schedules.length - 1].endAtSec,
    [schedules]
  );

  const weeklyUnlockRate = React.useMemo(() => {
    if (!(!isZero(totalLockedShares) && !isZero(totalLocked) && schedules))
      return Big('0');

    // const totalLockedSharesNormalized = totalLockedShares.div(1e18);

    const m = parseInt(Date.now() / 1e3);
    const i = Big(604800);

    const scheduleSharesEmitted = schedules.reduce((t, schedule) => {
      return t.add(
        min(max(schedule.endAtSec.sub(m), Big('0')), i)
          .div(schedule.durationSec)
          .mul(schedule.initialLockedShares)
      );
    }, Big('0'));

    return isZero(totalLocked)
      ? Big('0')
      : scheduleSharesEmitted
          .div(totalLockedShares)
          .mul(totalLocked)
          .div(1e9);
  }, [totalLockedShares, totalLocked, schedules]);

  const apy = React.useMemo(() => {
    if (!(!isZero(weeklyUnlockRate) && !isZero(totalUSDDeposits)))
      return Big('0');

    let BNB_APY = bnbUSDPrice
      .mul(250)
      .div(totalUSDDeposits)
      .mul(1730);

    let apy = weeklyUnlockRate
      .div(totalUSDDeposits)
      .mul(52)
      .mul(100)
      .add(CAKE_APY)
      .add(BNB_APY);

    if (apy.gte(1e6)) {
      apy = Big(1e6);
    }

    return apy;
  }, [weeklyUnlockRate, totalUSDDeposits, bnbUSDPrice]);

  const rewardMultiplier = React.useMemo(() => {
    if (!!isZero(startBonus)) return Big('1');
    const maxMultiplier = Big('1').div(startBonus);
    const minMultiplier = 1;
    const e = {
      startBonus,
      maxMultiplier,
      minMultiplier,
    };
    const p = availableDittoRewards;
    const m = totalUserRewards;
    let w = e.startBonus;
    const z = isZero(totalUserRewards) ? Big('1') : p.div(m);
    if (m.gt(Big('0'))) {
      w = max(w, z);
    }
    const _ = w.sub(e.startBonus).div(Big(1).sub(e.startBonus));
    const S = _.mul(e.maxMultiplier.sub(e.minMultiplier)).add(e.minMultiplier);
    // console.log(
    //   Object.entries({
    //     p,
    //     m,
    //     w,
    //     _,
    //     S,
    //     startBonus,
    //     maxMultiplier,
    //     minMultiplier,
    //     a: w.sub(e.startBonus),
    //     b: Big(1).sub(e.startBonus),
    //     z,
    //   }).reduce((r, [k, v]) => {
    //     r[k] = v.toString();
    //     return r;
    //   }, {})
    // );
    return S;
  }, [startBonus, totalUserRewards, availableDittoRewards]);

  const bnbPonusPoolSharePercentage = React.useMemo(() => {
    if (isZero(totalStakingShareSeconds)) return Big('0');
    return userStakingShareSeconds.div(totalStakingShareSeconds);
  }, [userStakingShareSeconds, totalStakingShareSeconds]);

  const bnbPonusPoolShareAmount = React.useMemo(() => {
    const poolAmount = Big('250').mul(10 ** wrappedBNBDecimals); // total amount of BNB paid out
    return poolAmount.mul(bnbPonusPoolSharePercentage);
  }, [bnbPonusPoolSharePercentage, wrappedBNBDecimals]);

  const loadPoolStats = async () => {
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
    const [
      totalStaked,
      totalLockedShares,
      unlockScheduleCount,
      totalStakingShares,
      totalLocked,
      noOfSchedules,
      totalSupply,
      startBonus,
      bonusPeriodSec,
      poolBNBBalance,
      poolDittoBalance,
      [bnbUSDPrice, dittoUSDPrice],
    ] = await Promise.all([
      stakingContract.totalStaked(),
      stakingContract.totalLockedShares(),
      stakingContract.unlockScheduleCount(),
      stakingContract.totalStakingShares(),
      stakingContract.totalLocked(),
      stakingContract.unlockScheduleCount(),
      lpContract.totalSupply(),
      stakingContract.startBonus(),
      stakingContract.bonusPeriodSec(),
      wrappedBNBContract.balanceOf(lpAddress),
      dittoContract.balanceOf(lpAddress),
      getCoinUsdPrices(['wbnb', 'ditto']),
      stakingContract.totalLocked(),
      stakingContract.unlockScheduleCount(),
    ]);

    const schedules = [];
    if (!noOfSchedules.isZero()) {
      for (let b = 0; b < noOfSchedules.toNumber(); b++) {
        const schedule = await stakingContract.unlockSchedules(b);
        schedules.push({
          initialLockedShares: Big(schedule.initialLockedShares),
          unlockedShares: Big(schedule.unlockedShares),
          lastUnlockTimestampSec: Big(schedule.lastUnlockTimestampSec),
          endAtSec: Big(schedule.endAtSec),
          durationSec: Big(schedule.durationSec),
        });
      }
    }

    setTotalStaked(Big(totalStaked));
    setTotalLockedShares(Big(totalLockedShares));
    setUnlockScheduleCount(Big(unlockScheduleCount));
    setTotalStakingShares(Big(totalStakingShares));
    setTotalLocked(Big(totalLocked));
    setTotalSupply(Big(totalSupply));
    setStartBonus(Big(startBonus).div(100));
    setBonusPeriodSec(Big(bonusPeriodSec));
    setPoolBNBBalance(Big(poolBNBBalance));
    setPoolDittoBalance(Big(poolDittoBalance));
    setBNBUSDPrice(Big(bnbUSDPrice));
    setDittoUSDPrice(Big(dittoUSDPrice));
    setUnlockSchedules(schedules);
  };

  const loadUserStats = async () => {
    if (!(stakingContract && address)) return;
    const [
      availableCakeRewards,
      totalStakedFor,
      [, , userStakingShareSeconds, totalStakingShareSeconds, totalUserRewards],
    ] = await Promise.all([
      stakingContract.pendingCakeByUser(address),
      stakingContract.totalStakedFor(address),
      stakingContract.callStatic.updateAccounting(),
    ]);
    const availableDittoRewards = totalStakedFor.isZero()
      ? '0'
      : await stakingContract.callStatic.unstakeQuery(totalStakedFor);
    setAvailableCakeRewards(Big(availableCakeRewards));
    setTotalStakedFor(Big(totalStakedFor));
    setAvailableDittoRewards(Big(availableDittoRewards));
    setTotalStakingShareSeconds(Big(totalStakingShareSeconds));
    setUserStakingShareSeconds(Big(userStakingShareSeconds));
    setTotalUserRewards(Big(totalUserRewards));
  };

  const subscribeToPoolStats = () => {
    if (!stakingContract) return;
    const stakedEvent = stakingContract.filters.Staked();
    const unstakedEvent = stakingContract.filters.Unstaked();
    stakingContract.on(stakedEvent, loadPoolStats);
    stakingContract.on(unstakedEvent, loadPoolStats);
    return () => {
      stakingContract.off(stakedEvent, loadPoolStats);
      stakingContract.off(unstakedEvent, loadPoolStats);
    };
  };

  const subscribeToUserStats = () => {
    if (!(stakingContract && address)) return;
    const stakedEvent = stakingContract.filters.Staked();
    const unstakedEvent = stakingContract.filters.Unstaked();
    stakingContract.on(stakedEvent, loadUserStats);
    stakingContract.on(unstakedEvent, loadUserStats);
    const cid = setInterval(loadUserStats, 1000 * 30);
    return () => {
      stakingContract.off(stakedEvent, loadUserStats);
      stakingContract.off(unstakedEvent, loadUserStats);
      clearInterval(cid);
    };
  };

  React.useEffect(() => {
    loadPoolStats();
    return subscribeToPoolStats(); // eslint-disable-next-line react-hooks/exhaustive-deps
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

  React.useEffect(() => {
    loadUserStats();
    return subscribeToUserStats(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stakingContract, address]);

  return (
    <StatsContext.Provider
      value={{
        totalStaked,
        totalLockedShares,
        unlockScheduleCount,
        totalStakingShares,
        totalLocked,
        totalSupply,
        startBonus,
        bonusPeriodSec,
        poolBNBBalance,
        poolDittoBalance,
        bnbUSDPrice,
        dittoUSDPrice,
        schedules,

        availableDittoRewards,
        availableCakeRewards,
        totalStakedFor,
        totalStakingShareSeconds,
        userStakingShareSeconds,

        apy,
        weeklyUnlockRate,
        totalUSDDeposits,
        stakingEndSec,
        rewardMultiplier,
        bnbPonusPoolSharePercentage,
        bnbPonusPoolShareAmount,
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
    totalStaked,
    totalLockedShares,
    unlockScheduleCount,
    totalStakingShares,
    totalLocked,
    totalSupply,
    startBonus,
    bonusPeriodSec,
    poolBNBBalance,
    poolDittoBalance,
    schedules,
    bnbUSDPrice,
    dittoUSDPrice,

    availableDittoRewards,
    availableCakeRewards,
    totalStakedFor,
    totalStakingShareSeconds,
    userStakingShareSeconds,

    apy,
    weeklyUnlockRate,
    totalUSDDeposits,
    stakingEndSec,
    rewardMultiplier,
    bnbPonusPoolSharePercentage,
    bnbPonusPoolShareAmount,
  } = context;

  return {
    totalStaked,
    totalLockedShares,
    unlockScheduleCount,
    totalStakingShares,
    totalLocked,
    totalSupply,
    startBonus,
    bonusPeriodSec,
    poolBNBBalance,
    poolDittoBalance,
    schedules,
    bnbUSDPrice,
    dittoUSDPrice,

    availableDittoRewards,
    availableCakeRewards,
    totalStakedFor,
    totalStakingShareSeconds,
    userStakingShareSeconds,

    apy,
    weeklyUnlockRate,
    totalUSDDeposits,
    stakingEndSec,
    rewardMultiplier,
    bnbPonusPoolSharePercentage,
    bnbPonusPoolShareAmount,
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
