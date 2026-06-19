const { execSync } = require('child_process');

const PORTS = [3000, 3001, 3002, 3003];

for (const port of PORTS) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = result.split('\n').filter(l => l.includes('LISTENING'));
      for (const line of lines) {
        const pid = line.trim().split(/\s+/).pop();
        if (pid && pid !== '0') {
          try {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
            console.log(`[kill-ports] 포트 ${port} (PID ${pid}) 종료`);
          } catch {}
        }
      }
    }
  } catch {}
}

console.log('[kill-ports] 포트 정리 완료 → 서버 시작 중...\n');
