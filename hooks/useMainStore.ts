import { CustomConvoType } from "@/app/api/conversations/route";
import { create } from "zustand";

interface BearState {
  openDetails: boolean;
  toggleOpenDetails: () => void;
  selectedConvo: CustomConvoType | null;
  setSelectedConvo: (convo: CustomConvoType) => void;
}

export const useMainStore = create<BearState>((set) => ({
  openDetails: false,
  toggleOpenDetails: () =>
    set((state) => ({ openDetails: !state.openDetails })),
  selectedConvo: null,
  setSelectedConvo: (convo) => set(() => ({ selectedConvo: convo })),
}));
