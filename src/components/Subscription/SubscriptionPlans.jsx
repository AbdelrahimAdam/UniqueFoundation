import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Crown, Star, Zap, Clock, Users, Video, Download, Award } from 'lucide-react';
import Button from '../UI/Button.jsx';

const SubscriptionPlans = () => {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [selectedPlan, setSelectedPlan] = useState(null);

  const billingCycles = [
    { id: 'monthly', label: t('subscription.billing.monthly', 'Monthly') },
    { id: 'yearly', label: t('subscription.billing.yearly', 'Yearly') }
  ];

  const featureIcons = {
    courses: Video,
    sessions: Clock,
    recordings: Video,
    support: Users,
    downloads: Download,
    certificate: Award,
    analytics: Zap
  };

  const plans = [
    {
      id: 'free',
      name: t('subscription.free.name'),
      description: t('subscription.free.description'),
      popular: false,
      current: true,
      features: [
        { id: 'basic-courses', text: t('subscription.free.features.0'), icon: 'courses' },
        { id: 'live-sessions', text: t('subscription.free.features.1'), icon: 'sessions' },
        { id: 'view-recordings', text: t('subscription.free.features.2'), icon: 'recordings' },
        { id: 'community-support', text: t('subscription.free.features.3'), icon: 'support' }
      ],
      pricing: {
        monthly: {
          price: '0',
          currency: '$',
          period: t('subscription.billing.month', 'month'),
          originalPrice: null,
          savings: null
        },
        yearly: {
          price: '0',
          currency: '$',
          period: t('subscription.billing.year', 'year'),
          originalPrice: null,
          savings: null
        }
      }
    },
    {
      id: 'premium',
      name: t('subscription.premium.name'),
      description: t('subscription.premium.description'),
      popular: true,
      current: false,
      features: [
        { id: 'all-free-features', text: t('subscription.premium.features.0'), icon: 'courses' },
        { id: 'advanced-courses', text: t('subscription.premium.features.1'), icon: 'courses' },
        { id: 'priority-support', text: t('subscription.premium.features.2'), icon: 'support' },
        { id: 'download-resources', text: t('subscription.premium.features.3'), icon: 'downloads' },
        { id: 'certificate', text: t('subscription.premium.features.4'), icon: 'certificate' },
        { id: 'advanced-analytics', text: t('subscription.premium.features.5', 'Advanced analytics'), icon: 'analytics' }
      ],
      pricing: {
        monthly: {
          price: '19.99',
          currency: '$',
          period: t('subscription.billing.month', 'month'),
          originalPrice: null,
          savings: null
        },
        yearly: {
          price: '199.99',
          currency: '$',
          period: t('subscription.billing.year', 'year'),
          originalPrice: '239.88',
          savings: t('subscription.billing.savings', 'Save 17%')
        }
      }
    },
    {
      id: 'pro',
      name: t('subscription.pro.name', 'Pro Plan'),
      description: t('subscription.pro.description', 'For institutions and organizations'),
      popular: false,
      current: false,
      features: [
        { id: 'all-premium-features', text: t('subscription.pro.features.0', 'All Premium features'), icon: 'courses' },
        { id: 'unlimited-courses', text: t('subscription.pro.features.1', 'Unlimited courses'), icon: 'courses' },
        { id: 'dedicated-support', text: t('subscription.pro.features.2', 'Dedicated support manager'), icon: 'support' },
        { id: 'custom-branding', text: t('subscription.pro.features.3', 'Custom branding'), icon: 'certificate' },
        { id: 'team-management', text: t('subscription.pro.features.4', 'Team management'), icon: 'users' },
        { id: 'api-access', text: t('subscription.pro.features.5', 'API access'), icon: 'analytics' }
      ],
      pricing: {
        monthly: {
          price: '49.99',
          currency: '$',
          period: t('subscription.billing.month', 'month'),
          originalPrice: null,
          savings: null
        },
        yearly: {
          price: '499.99',
          currency: '$',
          period: t('subscription.billing.year', 'year'),
          originalPrice: '599.88',
          savings: t('subscription.billing.savings', 'Save 17%')
        }
      }
    }
  ];

  const handleSubscribe = (planId) => {
    setSelectedPlan(planId);
    // In a real app, this would redirect to payment processing
    console.log(`Subscribing to ${planId} plan with ${billingCycle} billing`);
    
    // Simulate subscription process
    setTimeout(() => {
      alert(t('subscription.success.message', 'Subscription process started! You will be redirected to payment.'));
      setSelectedPlan(null);
    }, 1000);
  };

  const getPlanButtonText = (plan) => {
    if (plan.current) {
      return t('common.current');
    }
    
    if (plan.id === 'free') {
      return t('subscription.getStarted', 'Get Started');
    }
    
    return t('subscription.subscribe', 'Subscribe Now');
  };

  const getPlanButtonVariant = (plan) => {
    if (plan.current) {
      return 'outline';
    }
    return plan.popular ? 'primary' : 'outline';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('subscription.title', 'Choose Your Plan')}
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          {t('subscription.subtitle', 'Select the perfect plan for your learning journey. Start free, upgrade anytime.')}
        </p>
        
        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          {billingCycles.map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => setBillingCycle(cycle.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                billingCycle === cycle.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {cycle.label}
            </button>
          ))}
        </div>
        
        {/* Yearly Savings Notice */}
        {billingCycle === 'yearly' && (
          <p className="mt-4 text-sm text-green-600 font-medium">
            {t('subscription.billing.yearlyDiscount', 'Get 2 months free with yearly billing!')}
          </p>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {plans.map((plan) => {
          const currentPricing = plan.pricing[billingCycle];
          const FeatureIcon = featureIcons[plan.features[0]?.icon] || Check;
          
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                plan.popular
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'
                  : plan.current
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white shadow-sm'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center shadow-lg">
                    <Crown className="h-4 w-4 mr-1.5" />
                    {t('common.mostPopular')}
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    {t('subscription.currentPlan')}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <FeatureIcon className={`h-8 w-8 ${
                    plan.popular ? 'text-blue-600' : 
                    plan.current ? 'text-green-600' : 'text-gray-600'
                  }`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {currentPricing.currency}{currentPricing.price}
                    </span>
                    <span className="text-gray-500">/{currentPricing.period}</span>
                  </div>
                  
                  {/* Original Price & Savings */}
                  {currentPricing.originalPrice && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-sm text-gray-500 line-through">
                        {currentPricing.currency}{currentPricing.originalPrice}
                      </span>
                      <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                        {currentPricing.savings}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => {
                  const IconComponent = featureIcons[feature.icon] || Check;
                  return (
                    <li key={feature.id} className="flex items-start">
                      <IconComponent className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature.text}</span>
                    </li>
                  );
                })}
              </ul>

              {/* Action Button */}
              <Button
                className="w-full"
                variant={getPlanButtonVariant(plan)}
                size="lg"
                disabled={plan.current || selectedPlan === plan.id}
                loading={selectedPlan === plan.id}
                onClick={() => handleSubscribe(plan.id)}
              >
                {getPlanButtonText(plan)}
              </Button>

              {/* Free Plan Notice */}
              {plan.id === 'free' && !plan.current && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  {t('subscription.free.noCreditCard', 'No credit card required')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="mt-16 text-center">
        <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {t('subscription.faq.title', 'Frequently Asked Questions')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {t('subscription.faq.cancel.title', 'Can I cancel anytime?')}
              </h4>
              <p className="text-gray-600 text-sm">
                {t('subscription.faq.cancel.answer', 'Yes, you can cancel your subscription at any time. No long-term commitment required.')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {t('subscription.faq.refund.title', 'Is there a money-back guarantee?')}
              </h4>
              <p className="text-gray-600 text-sm">
                {t('subscription.faq.refund.answer', 'We offer a 30-day money-back guarantee for all paid plans.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;