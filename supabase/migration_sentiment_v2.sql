alter table public.posts    drop constraint if exists posts_sentiment_check;
alter table public.comments drop constraint if exists comments_sentiment_check;
alter table public.posts    add constraint posts_sentiment_check    check (sentiment in ('positive','neutral','negative','excited','mixed','frustrated','angry'));
alter table public.comments add constraint comments_sentiment_check check (sentiment in ('positive','neutral','negative','excited','mixed','frustrated','angry'));
