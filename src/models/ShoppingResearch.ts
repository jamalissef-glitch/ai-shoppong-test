
import mongoose, { Schema } from "mongoose";

const ProductListingSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    sellerName: {
      type: String,
      default: null,
    },
    productUrl: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    snippet: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const ProductOfferSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    sellerName: {
      type: String,
      default: null,
    },
    productUrl: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: null,
    },
    shippingCost: {
      type: Number,
      default: null,
    },
    condition: {
      type: String,
      default: null,
    },
    availability: {
      type: String,
      default: null,
    },
    analysisSummary: {
      type: String,
      default: null,
    },
    verificationSummary: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const VerificationEvidenceSchema = new Schema(
  {
    field: {
      type: String,
      enum: [
        "product",
        "price",
        "seller",
        "condition",
        "availability",
        "shipping",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "supported",
        "conflicting",
        "missing",
      ],
      required: true,
    },
    sourceUrl: {
      type: String,
      default: null,
    },
    evidenceText: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const VerifiedOfferSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    sellerName: {
      type: String,
      default: null,
    },
    productUrl: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: null,
    },
    shippingCost: {
      type: Number,
      default: null,
    },
    condition: {
      type: String,
      default: null,
    },
    availability: {
      type: String,
      default: null,
    },

    verificationStatus: {
      type: String,
      enum: [
        "verified",
        "partially_verified",
        "unverified",
      ],
      required: true,
    },

    evidence: {
      type: [String],
      default: [],
    },

    riskFlags: {
      type: [String],
      default: [],
    },

    verificationEvidence: {
      type: [VerificationEvidenceSchema],
      default: [],
    },
  },
  { _id: false }
);

const ShoppingResearchSchema = new Schema(
  {
    request: {
      productName: {
        type: String,
        required: true,
      },
      model: {
        type: String,
      },
      storage: {
        type: String,
      },
      condition: {
        type: String,
        enum: [
          "new",
          "used",
          "refurbished",
        ],
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      currency: {
        type: String,
      },
    },

    products: {
      type: [ProductListingSchema],
      default: [],
    },

    offers: {
      type: [ProductOfferSchema],
      default: [],
    },

    rankedOffers: {
      type: [ProductOfferSchema],
      default: [],
    },

    verifiedOffers: {
      type: [VerifiedOfferSchema],
      default: [],
    },

    agentStatus: {
      productScout: {
        type: String,
        enum: [
          "pending",
          "processing",
          "completed",
          "failed",
        ],
        default: "pending",
      },
      priceExtractor: {
        type: String,
        enum: [
          "pending",
          "processing",
          "completed",
          "failed",
        ],
        default: "pending",
      },
      priceAnalyst: {
        type: String,
        enum: [
          "pending",
          "processing",
          "completed",
          "failed",
        ],
        default: "pending",
      },
      verificationAgent: {
        type: String,
        enum: [
          "pending",
          "processing",
          "completed",
          "failed",
        ],
        default: "pending",
      },
      reportAgent: {
        type: String,
        enum: [
          "pending",
          "processing",
          "completed",
          "failed",
        ],
        default: "pending",
      },
    },

    analysisSummary: {
      type: String,
      default: null,
    },

    verificationSummary: {
      type: String,
      default: null,
    },

    finalReport: {
      type: String,
      default: null,
    },

    errors: {
      type: [String],
      default: [],
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ShoppingResearch =
  mongoose.models.ShoppingResearch ||
  mongoose.model(
    "ShoppingResearch",
    ShoppingResearchSchema
  );

export default ShoppingResearch;
