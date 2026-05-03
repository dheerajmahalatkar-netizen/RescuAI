import { EmergencyCategory } from "../types";

export interface Step {
  text: string;
  videoUrl?: string; // Placeholder or real
  narration: string;
}

export const FIRST_AID_STEPS: Record<EmergencyCategory | string, Step[]> = {
  [EmergencyCategory.BLEEDING]: [
    { 
      text: "Ensure the scene is safe and wear gloves if available.", 
      narration: "Safety first. Ensure the scene is safe and wear gloves if available." 
    },
    { 
      text: "Apply direct pressure to the wound using a clean cloth.", 
      narration: "Apply direct pressure to the wound with a clean cloth." 
    },
    { 
      text: "Maintain pressure until bleeding stops.", 
      narration: "Maintain pressure until the bleeding stops." 
    },
    { 
      text: "If blood soaks through, do not remove cloth; add more on top.", 
      narration: "If blood soaks through, don't remove the cloth. Just add more on top." 
    }
  ],
  [EmergencyCategory.FIRE]: [
    { 
      text: "Get everyone out and stay low to the ground.", 
      narration: "Evacuate immediately. Stay low to the ground to avoid smoke." 
    },
    { 
      text: "In case of fire on clothing: Stop, Drop, and Roll.", 
      narration: "If clothing is on fire, Stop, Drop, and Roll." 
    },
    { 
      text: "Call the fire department (101) immediately.", 
      narration: "Call the fire department immediately." 
    }
  ],
  [EmergencyCategory.BREATHING]: [
    { 
      text: "Check if the person is conscious by tapping their shoulder.", 
      narration: "Check for consciousness. Tap their shoulder and ask if they are okay." 
    },
    { 
      text: "If unconscious and not breathing, start CPR: 30 compressions.", 
      narration: "If they aren't breathing, start CPR with 30 chest compressions." 
    },
    { 
      text: "Push hard and fast in the center of the chest.", 
      narration: "Push hard and fast in the center of the chest." 
    }
  ],
  [EmergencyCategory.ACCIDENT]: [
    { 
      text: "Do not move the victim unless there is an immediate danger.", 
      narration: "Do not move the victim unless absolutely necessary for safety." 
    },
    { 
      text: "Call emergency services and provide exact location.", 
      narration: "Call emergency services and provide your exact location." 
    }
  ],
  [EmergencyCategory.MEDICAL]: [
    { 
      text: "Keep the person calm and loosen tight clothing.", 
      narration: "Keep the person calm and loosen any tight clothing." 
    },
    { 
      text: "Ask for any existing medical conditions or allergies.", 
      narration: "Ask if they have any known medical conditions or allergies." 
    }
  ],
  [EmergencyCategory.OTHER]: [
    { 
      text: "Stay calm and identify the most immediate threat.", 
      narration: "Stay calm and assess the most immediate threat." 
    },
    { 
      text: "Follow standard emergency protocols and call for help.", 
      narration: "Follow standard protocols and call for help." 
    }
  ]
};
