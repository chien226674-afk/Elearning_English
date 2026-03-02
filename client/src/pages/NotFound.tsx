export default function NotFound() {
  return<>
  <div className="flex flex-col items-center justify_center min-h-screen text-center bg-slate-50">
    <img src="404_NotFound.png" alt="not found" className="max-w-full mb-6 w-96 mt-10"></img>
    <p className="text-xl font-semibold">
      Không tìm thấy trang vui lòng quay lại trang chủ 🚫
    </p>
    <a href="/"   className="inline-block px-6 py-3 mt-6 font-medium text-white transition shadow-md bg-primary rounded-2xl hover:bg-primary">Quay về trang chủ</a>
  </div>
  </>
}
