import React from 'react';
import { Big } from 'utils/big-number';
import { useWallet } from 'contexts/wallet';

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
  } = useWallet();

  const [apy, setAPY] = React.useState(Big('0'));
  const [totalDeposits, setTotalDeposits] = React.useState(Big('0'));
  const [programDuration, setProgramDuration] = React.useState(0);

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

    const A = Big('1'); // price of Ditto
    // C: 82772.14027431;
    // E: 0.07200446090062249; // stakingContract.totalSupply
    // I: 0.11845874260168594;
    // N: 15929.034962326905;
    // O: 51696.91293764091;
    // P: 82772.14027431;
    // T: 116.43448859829034;
    const k = Big('37'); // price of BNB
    // w: 0.008529557899999998; // stakingContract.totalStaked

    const O = k.mul(T);
    const P = A.mul(C);
    const I = w.div(E);
    // console.log(r);
    const N = O.add(P).mul(I);

    console.log('deposits', N.toString());
    setTotalDeposits(N);

    const noOfSchedules = await stakingContract.unlockScheduleCount();
    console.log(noOfSchedules.toNumber());
    if (!noOfSchedules.isZero()) {
      const schedules = [];
      for (let b = 0; b < noOfSchedules.toNumber(); b++) {
        const schedule = await stakingContract.unlockSchedules(
          noOfSchedules.sub(1).toNumber()
        );
        schedules.push(schedule);
      }
      setProgramDuration(schedules[schedules.length].endAtSec.toNumber());

      const [s, a] = await Promise.all([
        stakingContract.totalLockedShares(),
        stakingContract.totalLocked(),
      ]);

      const i = 60 * 60 * 24 * 30; // 2592e3

      const ip = (t, e) => (t.gte(e) ? t : e);
      const op = (t, e) => (t.lte(e) ? t : e);

      const hha = schedules.reduce((t, schedule) => {
        return t.add(
          op(ip(schedule.endAtSec.sub(m), 0), i)
            .div(schedule.durationSec)
            .mul(schedule.initialLockedShares)
        );
      }, 0);

      const hh = hha.div(a).mul(s);

      let apy = hh.div(N).mul(12);
      if (apy.gte(1e6)) {
        apy = Big(1e6);
      }

      console.log('apy', apy.toString());
      setAPY(apy);
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

  return (
    <StatsContext.Provider
      value={{
        apy,
        totalDeposits,
        programDuration,
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
  const { apy, totalDeposits, programDuration } = context;

  return {
    apy,
    totalDeposits,
    programDuration,
  };
}
