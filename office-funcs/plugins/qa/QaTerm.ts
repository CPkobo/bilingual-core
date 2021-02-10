// import { DataInfo, QaResultInfo } from '../core/pdbIF';

// Qaの子関数。用語が正しく使われているかをチェックする
function QaTerm(data: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const tt = data.QA.tt;
        const tResults: any[] = [];
        for (const termsInfo of data.CAT.usedTerms) {
            let ttHitedNum: number = 0;
            for (const term of termsInfo.tts) {
                const tterm = new RegExp(term, 'g');
                const ttHited = tt.match(tterm);
                if (ttHited !== null) {
                    ttHitedNum += ttHited.length;
                }
            }
            if (termsInfo.times !== ttHitedNum) {
                const differ: number = Math.abs(termsInfo.times - ttHitedNum);
                tResults.push({
                    errtype: `Terms Differ ${differ}`,
                    sInfo: `${termsInfo.st}: ${termsInfo.times}`,
                    tInfo: `${termsInfo.tts.join('||')}: ${ttHitedNum}`,
                });
            }
        }
        resolve(tResults);
    });
}

export default QaTerm;
