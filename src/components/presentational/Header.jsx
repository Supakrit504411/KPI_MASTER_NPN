import { Zap, RefreshCw, LogIn, LogOut } from 'lucide-react';

export default function Header({ onRefresh, isLoading, liff }) {
  return (
    <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                PEA Dashboard
              </h1>
              <p className="text-blue-100 text-sm">
                แดชบอร์ดสรุปผลการประเมิน — กฟภ.นพ. กฟภ.ธพ. กฟภ.นก. กฟภ.บพง.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {liff?.ready && (
              liff.loggedIn ? (
                <div className="flex items-center gap-2">
                  {liff.profile?.pictureUrl && (
                    <img
                      src={liff.profile.pictureUrl}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-white/50"
                    />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">
                    {liff.profile?.displayName || 'LINE User'}
                  </span>
                  <button
                    onClick={liff.logout}
                    className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    ออก
                  </button>
                </div>
              ) : (
                <button
                  onClick={liff.login}
                  className="flex items-center gap-1.5 bg-[#06C755] hover:bg-[#05b34d] px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  LINE Login
                </button>
              )
            )}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30
                         disabled:opacity-50 disabled:cursor-not-allowed
                         px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              รีเฟรชข้อมูล
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
