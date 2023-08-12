// import { DataInfo, QaResultInfo } from '../core/pdbIF';

// Qaの子関数。数字が正しく使われているかをチェックする
function QaNum(data: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const st = data.QA.st;
        const tt = data.QA.tt;
        const nResults: any[] = [];
        const regNumbers = new RegExp('[0-9]+', 'g');
        const numsInSource: null | string[] = st.match(regNumbers);
        const nss = numsInSource === null ? [] : numsInSource;
        const numsInTarget: null | string[] = tt.match(regNumbers);
        const nts = numsInTarget === null ? [] : numsInTarget;
        for (const ns of nss) {
            const hitInT = nts.indexOf(ns);
            if (hitInT === -1) {
                nResults.push({
                    errtype: 'Number',
                    sInfo: ns,
                    tInfo: '',
                });
            } else {
                nts.splice(hitInT, 1);
            }
        }
        if (nts.length > 0) {
            for (const nt of nts) {
                nResults.push({
                    errtype: 'Number',
                    sInfo: '',
                    tInfo: nt,
                });
            }
        }
        resolve(nResults);
    });
}

export default QaNum;
