// src/pages/funding/FundingCreatePage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import useModalStore from "../../stores/useModalStore";
import { parseJwt } from "../../utils/parseJwt";

// 랜덤 데이터 생성 유틸
const generateRandomFunding = () => {
  const titles = [
    "혁신적인 스마트 텀블러",
    "친환경 대나무 키보드",
    "AI 반려동물 급식기",
    "미니 포터블 프로젝터",
    "수제 가죽 노트북 파우치",
    "스마트 화분 자동 관수기",
    "무선 충전 마우스패드",
    "접이식 전동 킥보드",
  ];

  const rewardNames = [
    ["얼리버드 기본 패키지", "프리미엄 패키지", "VIP 올인원 패키지"],
    ["스탠다드", "디럭스", "얼티밋"],
    ["베이직", "프로", "엔터프라이즈"],
  ];

  const randomTitle = titles[Math.floor(Math.random() * titles.length)];
  const randomRewardSet =
    rewardNames[Math.floor(Math.random() * rewardNames.length)];

  const now = new Date();
  const startAt = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 내일
  const holdTo = new Date(startAt.getTime() + 1000 * 60 * 60 * 24 * 30); // 30일 후
  const payAt = new Date(holdTo.getTime() + 1000 * 60 * 60 * 24 * 3); // 마감 3일 후

  const formatDateTime = (date) => date.toISOString().slice(0, 16);

  return {
    title: randomTitle,
    goalAmount: String((Math.floor(Math.random() * 50) + 5) * 100000), // 50만~550만
    startAt: formatDateTime(startAt),
    holdTo: formatDateTime(holdTo),
    payAt: formatDateTime(payAt),
    type: Math.random() > 0.5 ? "RESERVED" : "INSTANT",
    rewards: randomRewardSet.map((name, idx) => ({
      name,
      description: `${name} 상품 설명입니다.`,
      limitQty: String((idx + 1) * 50),
      badgeType: idx === 2 ? "GOLD" : idx === 1 ? "SILVER" : "BRONZE",
      price: String((idx + 1) * 15000),
      offerAt: formatDateTime(startAt),
      shippingCharge: String(idx === 0 ? 0 : 3000),
    })),
  };
};

export default function FundingCreatePage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const [loading, setLoading] = useState(false);

  // 역할 체크
  const token = localStorage.getItem("accessToken");
  const payload = parseJwt(token);
  const isMaker = payload?.roles?.includes("MAKER");

  const [form, setForm] = useState({
    title: "",
    goalAmount: "",
    startAt: "",
    holdTo: "",
    payAt: "",
    type: "RESERVED",
    rewards: [
      {
        name: "",
        description: "",
        limitQty: "",
        badgeType: "",
        price: "",
        offerAt: "",
        shippingCharge: "0",
      },
    ],
  });

  // 역할이 MAKER가 아니면 안내 화면
  if (!isMaker) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 border rounded-lg shadow-md bg-white text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold mb-2">창작자 전용 기능입니다</h2>
        <p className="text-gray-500 mb-6">
          펀딩을 만들려면 창작자 역할이 필요합니다.
          <br />
          마이페이지에서 역할을 전환해주세요.
        </p>
        <button
          onClick={() => navigate("/mypage")}
          className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-600 cursor-pointer"
        >
          마이페이지에서 역할 변경하기 →
        </button>
      </div>
    );
  }

  // 랜덤 채우기
  const handleRandomFill = () => {
    setForm(generateRandomFunding());
  };

  // 폼 필드 변경
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 리워드 필드 변경
  const handleRewardChange = (idx, field, value) => {
    setForm((prev) => {
      const rewards = [...prev.rewards];
      rewards[idx] = { ...rewards[idx], [field]: value };
      return { ...prev, rewards };
    });
  };

  // 리워드 추가
  const addReward = () => {
    setForm((prev) => ({
      ...prev,
      rewards: [
        ...prev.rewards,
        {
          name: "",
          description: "",
          limitQty: "",
          badgeType: "",
          price: "",
          offerAt: "",
          shippingCharge: "0",
        },
      ],
    }));
  };

  // 리워드 삭제
  const removeReward = (idx) => {
    setForm((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== idx),
    }));
  };

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: form.title,
        goalAmount: Number(form.goalAmount),
        startAt: form.startAt + ":00",
        holdTo: form.holdTo + ":00",
        payAt: form.payAt + ":00",
        type: form.type,
        rewards: form.rewards.map((r) => ({
          name: r.name,
          description: r.description,
          limitQty: Number(r.limitQty),
          badgeType: r.badgeType || null,
          price: Number(r.price),
          offerAt: r.offerAt + ":00",
          shippingCharge: Number(r.shippingCharge),
        })),
      };

      const res = await apiClient.post("/api/fundings", payload);
      console.log("[DEBUG] 펀딩 생성 성공:", res.data);
      openModal({
        title: "성공",
        message: "펀딩이 생성되었습니다!",
        type: "success",
      });
      navigate(`/fundings/${res.data.fundingId || res.data.id}`);
    } catch (err) {
      console.error("[DEBUG] 펀딩 생성 실패:", err);
      openModal({
        title: "펀딩 생성 실패",
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🚀 펀딩 만들기</h1>
        <button
          type="button"
          onClick={handleRandomFill}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-600"
        >
          🎲 랜덤 생성
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="font-bold text-lg border-b pb-2">기본 정보</h2>

          <div>
            <label className="block text-sm font-medium mb-1">펀딩 제목</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                목표 금액 (원)
              </label>
              <input
                type="number"
                value={form.goalAmount}
                onChange={(e) => handleChange("goalAmount", e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                펀딩 타입
              </label>
              <select
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="RESERVED">예약 펀딩 (RESERVED)</option>
                <option value="INSTANT">즉시 펀딩 (INSTANT)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">시작일</label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => handleChange("startAt", e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">마감일</label>
              <input
                type="datetime-local"
                value={form.holdTo}
                onChange={(e) => handleChange("holdTo", e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">결제일</label>
              <input
                type="datetime-local"
                value={form.payAt}
                onChange={(e) => handleChange("payAt", e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>
          </div>
        </div>

        {/* 리워드 목록 */}
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-bold text-lg">
              리워드 ({form.rewards.length}개)
            </h2>
            <button
              type="button"
              onClick={addReward}
              className="text-sm bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600"
            >
              + 리워드 추가
            </button>
          </div>

          {form.rewards.map((reward, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-4 space-y-3 bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-600">
                  리워드 #{idx + 1}
                </span>
                {form.rewards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReward(idx)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    리워드명
                  </label>
                  <input
                    type="text"
                    value={reward.name}
                    onChange={(e) =>
                      handleRewardChange(idx, "name", e.target.value)
                    }
                    className="w-full border rounded px-3 py-1.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    뱃지 타입
                  </label>
                  <input
                    type="text"
                    value={reward.badgeType}
                    onChange={(e) =>
                      handleRewardChange(idx, "badgeType", e.target.value)
                    }
                    className="w-full border rounded px-3 py-1.5 text-sm"
                    placeholder="EARLY_BIRD, SUPER_EARLY_BIRD, ULTRA_EARLY_BIRD..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">설명</label>
                <input
                  type="text"
                  value={reward.description}
                  onChange={(e) =>
                    handleRewardChange(idx, "description", e.target.value)
                  }
                  className="w-full border rounded px-3 py-1.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    가격 (원)
                  </label>
                  <input
                    type="number"
                    value={reward.price}
                    onChange={(e) =>
                      handleRewardChange(idx, "price", e.target.value)
                    }
                    className="w-full border rounded px-3 py-1.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    수량 제한
                  </label>
                  <input
                    type="number"
                    value={reward.limitQty}
                    onChange={(e) =>
                      handleRewardChange(idx, "limitQty", e.target.value)
                    }
                    className="w-full border rounded px-3 py-1.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    배송비 (원)
                  </label>
                  <input
                    type="number"
                    value={reward.shippingCharge}
                    onChange={(e) =>
                      handleRewardChange(idx, "shippingCharge", e.target.value)
                    }
                    className="w-full border rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    제공 시작일
                  </label>
                  <input
                    type="datetime-local"
                    value={reward.offerAt}
                    onChange={(e) =>
                      handleRewardChange(idx, "offerAt", e.target.value)
                    }
                    className="w-full border rounded px-3 py-1.5 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 제출 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-500 text-white py-3 rounded-lg font-bold text-lg hover:bg-teal-600 disabled:bg-gray-300"
        >
          {loading ? "생성 중..." : "🚀 펀딩 생성하기"}
        </button>
      </form>
    </div>
  );
}
