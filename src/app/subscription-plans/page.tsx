"use client";
import React, { useState } from 'react';
import { 
  Container, Typography, Box, Grid, Card, CardContent, CardHeader, 
  Button, Divider, Radio, RadioGroup, 
  FormControlLabel, CardActions, Chip, useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


// Style for subscription card
const SubscriptionCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isSelected'
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  height: '100%',
  display: 'flex', 
  flexDirection: 'column', 
  transition: 'all 0.3s ease',
  transform: isSelected ? 'scale(1.03)' : 'scale(1)',
  borderRadius: 16,
  overflow: 'hidden',
  position: 'relative',
  border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid rgba(145, 158, 171, 0.12)',
  boxShadow: isSelected 
    ? '0 10px 30px rgba(0, 0, 0, 0.1)' 
    : '0 5px 15px rgba(0, 0, 0, 0.05)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
  }
}));

// Styled for featured subscription badge
const FeatureChip = styled(Chip)(() => ({
  position: 'absolute',
  top: 16,
  right: 16,
  borderRadius: 16,
  fontWeight: 600,
  padding: '0 12px',
}));

// Header with back link
const HeaderSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
  },
}));

// Feature list item styling
const FeatureItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(1.5),
}));

const PricingCardHeader = styled(CardHeader)(({ theme }) => ({
  backgroundColor: 'rgba(145, 158, 171, 0.04)',
  padding: theme.spacing(2), 
}));

const PricingCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(2), 
  flexGrow: 1, 
}));

const PricingCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2), 
  paddingTop: 0,
  marginTop: 'auto', 
}));

export default function SubscriptionPlans() {
  const t = (key: string, _opts?: any) => key;
  const router = useRouter();
  const theme = useTheme();
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [isSubmitting, setIsSubmitting] = useState(false); 


  
  const subscriptionPlans = [
    {
      id: '6mois',
      name: t('subscription.plans.6months.name'),
      price: 8000,
      period: t('subscription.plans.6months.period'),
      description: t('subscription.plans.6months.description'),
      features: [
        t('subscription.feature.basicTools'),
        t('subscription.feature.standardSupport'),
        t('subscription.feature.basicAnalytics')
      ],
      isPopular: false
    },
    {
      id: '1an',
      name: t('subscription.plans.1year.name'),
      price: 10000,
      period: t('subscription.plans.1year.period'),
      description: t('subscription.plans.1year.description'),
      features: [
        t('subscription.feature.advancedTools'),
        t('subscription.feature.prioritySupport'),
        t('subscription.feature.advancedAnalytics')
      ],
      isPopular: true
    },
    {
      id: 'gold',
      name: t('subscription.plans.gold.name'),
      price: 15000,
      period: t('subscription.plans.gold.period'),
      description: t('subscription.plans.gold.description'),
      features: [
        t('subscription.feature.proTools'),
        t('subscription.feature.vipSupport'),
        t('subscription.feature.marketingTools'),
        t('subscription.feature.apiAccess')
      ],
      isPopular: false
    }
  ];

  const handlePlanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPlan(event.target.value);
  };

  const handleSubscribe = () => { 
    setIsSubmitting(true); 
    const isValidPlan = subscriptionPlans.some(plan => plan.id === selectedPlan);

    if (isValidPlan) {
      console.log('Subscription plan selected:', selectedPlan);
      setTimeout(() => {
        setIsSubmitting(false);
        router.push('/profile'); 
      }, 500); 
    } else {
      setIsSubmitting(false);
      alert(t('subscription.selectValidPlan'));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <HeaderSection>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ mr: 1.5, color: theme.palette.primary.main, fontWeight: 'bold' }}>
            MazadClick
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('subscription.title')}
          </Typography>
        </Box>
      </HeaderSection>

      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          {t('subscription.subtitle')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
          {t('subscription.description')}
        </Typography>
      </Box>

      <RadioGroup
        value={selectedPlan}
        onChange={handlePlanChange}
        sx={{ width: '100%' }}
      >
        <Grid 
          container 
          spacing={2} 
          justifyContent="center"
          sx={{ 
            display: 'flex',
            flexWrap: 'nowrap', 
          }}
        >
          {subscriptionPlans.map((plan) => (
            <Grid 
              component="div"
              key={plan.id}
              sx={{ 
                flex: '1 1 0%', 
                minWidth: '220px', 
                maxWidth: '350px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'stretch', 
              }}
            >
              <SubscriptionCard isSelected={selectedPlan === plan.id}>
                {plan.isPopular && (
                  <FeatureChip 
                    label={t('subscription.recommended')} 
                    color="primary"
                    icon={<span>⭐</span>}
                  />
                )}
                {plan.id === 'gold' && (
                  <FeatureChip
                    label={t('subscription.gold')}
                    sx={{
                      background: 'linear-gradient(90deg, #FFD700 0%, #FFC107 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(255, 215, 0, 0.2)'
                    }}
                    icon={<span>👑</span>}
                  />
                )}
                <PricingCardHeader
                  title={
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      {plan.name}
                    </Typography>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1 }}>
                      <Typography variant="h3" component="span" sx={{ fontWeight: 700 }}>
                        {plan.price.toLocaleString()} DA
                      </Typography>
                      <Typography variant="subtitle1" sx={{ ml: 0.5, mb: 0.5, color: 'text.secondary' }}>
                        /{plan.period}
                      </Typography>
                    </Box>
                  }
                  action={
                    <FormControlLabel 
                      value={plan.id} 
                      control={<Radio />} 
                      label="" 
                      sx={{ mr: 0 }}
                    />
                  }
                />
                <PricingCardContent>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    {plan.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mt: 2 }}>
                    {(plan.features as string[]).map((feature, index) => (
                      <FeatureItem key={index}>
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            style={{ color: theme.palette.success.main, marginRight: theme.spacing(1.5), fontSize: 20 }}
                        >
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <Typography variant="body2">{feature}</Typography>
                      </FeatureItem>
                    ))}
                  </Box>
                </PricingCardContent>
                <PricingCardActions>
                  <Button 
                    fullWidth
                    variant={selectedPlan === plan.id ? "contained" : "outlined"}
                    color="primary"
                    size="large"
                    onClick={() => setSelectedPlan(plan.id)}
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none',
                      py: 1,
                      fontWeight: 600
                    }}
                  >
                    {selectedPlan === plan.id ? t('subscription.selected') : t('subscription.select')}
                  </Button>
                </PricingCardActions>
              </SubscriptionCard>
            </Grid>
          ))}
        </Grid>
      </RadioGroup>

      <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
        <LoadingButton 
          variant="contained" 
          size="large"
          loading={isSubmitting}
          onClick={handleSubscribe}
          sx={{
            py: 1.5,
            px: 4,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem'
          }}
        >
          {t('subscription.subscribe')}
        </LoadingButton>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('subscription.modifySubscription')}{' '}
          <Link href="/terms" style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>
            {t('subscription.termsOfUse')}
          </Link>
          {' '}{t('subscription.and')}{' '}
          <Link href="/privacy" style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>
            {t('subscription.privacyPolicy')}
          </Link>.
        </Typography>
      </Box>
    </Container>
  );
}
